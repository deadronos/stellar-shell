import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { BvxEngine } from '../services/BvxEngine';
import { BlockType } from '../types';
import { FRAME_COST, BLOCK_COLORS } from '../constants';
import { ECS, Entity } from '../ecs/world';

const ENGINE = BvxEngine.getInstance();
const DRONE_SPEED = 20; // Faster to compensate for return trips
const SEPARATION_DIST = 2.5;
const MAX_PARTICLES = 1000;
const HUB_POSITION = new THREE.Vector3(0, 0, 0);

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  active: boolean;
}

export const Drones = () => {
  const droneCount = useStore((state) => state.droneCount);
  const droneMeshRef = useRef<THREE.InstancedMesh>(null);
  const cargoMeshRef = useRef<THREE.InstancedMesh>(null);
  const particleMeshRef = useRef<THREE.InstancedMesh>(null);

  // Reuse ThreeJS objects to avoid GC
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyCargo = useMemo(() => new THREE.Object3D(), []);
  const dummyParticle = useMemo(() => new THREE.Object3D(), []);

  // Particle System (Legacy Array-based for now)
  const particles = useRef<Particle[]>([]);
  const particleCursor = useRef(0);

  // Initialize particles
  useMemo(() => {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.current.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        active: false,
      });
    }
  }, []);

  const spawnExplosion = (position: THREE.Vector3, color: string, count: number = 8) => {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const idx = particleCursor.current;
      const p = particles.current[idx];
      p.active = true;
      p.life = 1.0;
      p.position
        .copy(position)
        .add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5));
      p.velocity.set(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
      );
      p.color.copy(c);

      particleCursor.current = (particleCursor.current + 1) % MAX_PARTICLES;
    }
  };

  // Sync ECS Population
  useEffect(() => {
    // Get current drone entities
    const drones = ECS.with('isDrone').entities;
    const currentCount = drones.length;

    if (currentCount < droneCount) {
      // Spawn more
      for (let i = currentCount; i < droneCount; i++) {
        ECS.add({
          position: new THREE.Vector3(0, 0, 0),
          velocity: new THREE.Vector3(0, 0, 0),
          isDrone: true,
          state: 'IDLE',
          carryingType: null,
          color: new THREE.Color('#ffcc00'),
        });
      }
    } else if (currentCount > droneCount) {
      // Despawn extras
      for (let i = currentCount - 1; i >= droneCount; i--) {
        ECS.remove(drones[i]);
      }
    }
  }, [droneCount]);

  // Archetypes
  const dronesArchetype = useMemo(() => ECS.with('isDrone', 'position', 'velocity'), []);
  const idleDrones = useMemo(
    () => ECS.with('isDrone', 'position', 'velocity').without('target'),
    [],
  );
  const movingDrones = useMemo(() => ECS.with('isDrone', 'position', 'velocity', 'target'), []);
  const targetBlockDrones = useMemo(() => ECS.with('targetBlock'), []);

  useFrame((state, delta) => {
    if (!droneMeshRef.current || !cargoMeshRef.current) return;

    const currentMatter = useStore.getState().matter;
    const addMatter = useStore.getState().addMatter;
    const consumeMatter = useStore.getState().consumeMatter;
    const { clock } = state;

    // --- 1. BRAIN SYSTEM (Decision Making) ---
    // Only process idle drones if we need to find new tasks

    // Cache queries for the frame
    let cachedBlueprints: { x: number; y: number; z: number }[] | null = null;
    let cachedMines: { x: number; y: number; z: number }[] | null = null;
    const getBlueprints = () => {
      if (!cachedBlueprints) cachedBlueprints = ENGINE.findBlueprints();
      return cachedBlueprints;
    };
    const getMines = () => {
      if (!cachedMines) cachedMines = ENGINE.findMiningTargets(droneCount + 20);
      return cachedMines;
    };

    // Build reserved set from ECS
    const reservedBlocks = new Set<string>();
    for (const d of targetBlockDrones) {
      if (d.targetBlock) {
        reservedBlocks.add(`${d.targetBlock.x},${d.targetBlock.y},${d.targetBlock.z}`);
      }
    }

    for (const drone of idleDrones) {
      // Default Logic: IDLE
      const blueprints = getBlueprints();
      const canBuild = currentMatter >= FRAME_COST;

      let bestTarget: { x: number; y: number; z: number } | null = null;
      let minDistSq = Infinity;
      let targetType: 'BUILD' | 'MINE' | null = null;

      const findClosest = (list: { x: number; y: number; z: number }[], type: 'BUILD' | 'MINE') => {
        for (const item of list) {
          const key = `${item.x},${item.y},${item.z}`;
          if (reservedBlocks.has(key)) continue;

          const dx = item.x - drone.position.x;
          const dy = item.y - drone.position.y;
          const dz = item.z - drone.position.z;
          const dSq = dx * dx + dy * dy + dz * dz;

          if (dSq < minDistSq) {
            minDistSq = dSq;
            bestTarget = item;
            targetType = type;
          }
        }
      };

      if (canBuild) findClosest(blueprints, 'BUILD');
      if (!bestTarget) findClosest(getMines(), 'MINE');

      if (bestTarget && targetType) {
        const t = bestTarget as { x: number; y: number; z: number };
        // Add components to transition state
        ECS.addComponent(drone, 'target', new THREE.Vector3(t.x, t.y, t.z));
        ECS.addComponent(drone, 'targetBlock', t);

        drone.state = targetType === 'BUILD' ? 'MOVING_TO_BUILD' : 'MOVING_TO_MINE';
        drone.carryingType = targetType === 'BUILD' ? BlockType.FRAME : null;

        reservedBlocks.add(`${t.x},${t.y},${t.z}`);
      } else {
        // Dynamic Orbit (Idle behavior)
        // We can simulate an "Orbit Target" without a "Target Block"
        // But to keep it simple with 'target' component logic:
        const time = clock.elapsedTime * 0.1 + (drone.id || Math.random() * 100) * 0.137;
        const radius = 30 + Math.sin(time * 2.0) * 5;
        const height = Math.sin(time * 0.5) * 15;

        const orbitPos = new THREE.Vector3(
          Math.cos(time) * radius,
          height,
          Math.sin(time) * radius,
        );

        ECS.addComponent(drone, 'target', orbitPos);
        // We DON'T add targetBlock, so it doesn't reserve anything
      }
    }

    // --- 2. MOVEMENT & INTERACTION SYSTEM ---
    for (const drone of movingDrones) {
      if (!drone.target || !drone.velocity) continue;

      const distToTarget = drone.position.distanceTo(drone.target);
      const isOrbiting = drone.state === 'IDLE'; // IDLE just means not doing a specific task, but moving to orbit

      // Arrival Check
      if (!isOrbiting && distToTarget < 1.5) {
        // ACTION LOGIC
        if (drone.state === 'MOVING_TO_BUILD' && drone.targetBlock) {
          const { x, y, z } = drone.targetBlock;
          if (ENGINE.getBlock(x, y, z) === BlockType.FRAME) {
            if (consumeMatter(FRAME_COST)) {
              ENGINE.setBlock(x, y, z, BlockType.PANEL);
              spawnExplosion(drone.target, '#00d0ff', 12);
            }
          }
          // Reset
          drone.state = 'IDLE';
          ECS.removeComponent(drone, 'target');
          ECS.removeComponent(drone, 'targetBlock');
          drone.carryingType = null;
        } else if (drone.state === 'MOVING_TO_MINE' && drone.targetBlock) {
          const { x, y, z } = drone.targetBlock;
          const block = ENGINE.getBlock(x, y, z);
          if (block === BlockType.ASTEROID_SURFACE || block === BlockType.ASTEROID_CORE) {
            ENGINE.setBlock(x, y, z, BlockType.AIR);
            spawnExplosion(drone.target, '#888888', 8);

            drone.carryingType = block;
            drone.state = 'RETURNING_RESOURCE';

            // Set new target: Hub
            const returnPos = HUB_POSITION.clone().add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 8,
              ),
            );
            drone.target.copy(returnPos);

            // Remove targetBlock so we don't reserve it anymore
            ECS.removeComponent(drone, 'targetBlock');
          } else {
            // Fail
            drone.state = 'IDLE';
            ECS.removeComponent(drone, 'target');
            ECS.removeComponent(drone, 'targetBlock');
          }
        } else if (drone.state === 'RETURNING_RESOURCE') {
          if (drone.carryingType === BlockType.ASTEROID_CORE) addMatter(2);
          else addMatter(1);

          drone.carryingType = null;
          drone.state = 'IDLE';
          ECS.removeComponent(drone, 'target');
        } else {
          // Fallback for IDLE/Orbit arrival (loop)
          if (isOrbiting) {
            // Just keep orbiting, the brain will update target
            ECS.removeComponent(drone, 'target');
          }
        }

        drone.velocity.multiplyScalar(0.5);
      } else {
        // STEERING
        // Re-verify target existence in case it was removed
        if (drone.target) {
          const desired = new THREE.Vector3().subVectors(drone.target, drone.position);
          const dist = desired.length();
          desired.normalize();

          if (!isOrbiting && dist < 5) {
            desired.multiplyScalar(DRONE_SPEED * (dist / 5));
          } else {
            desired.multiplyScalar(DRONE_SPEED);
          }

          const steer = new THREE.Vector3().subVectors(desired, drone.velocity);
          steer.clampLength(0, 35 * delta);
          drone.velocity.add(steer);
        }
      }
    }

    // Separation Logic (Inner Loop - Performance Critical)
    // We iterate all drones to steer them apart
    const droneEntities = dronesArchetype.entities;
    const count = droneEntities.length;

    for (let i = 0; i < count; i++) {
      const d1 = droneEntities[i];
      if (!d1.velocity) continue;

      const separation = new THREE.Vector3();
      let neighbors = 0;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const d2 = droneEntities[j];

        const distSq = d1.position.distanceToSquared(d2.position);
        // SEPARATION_DIST = 2.5, Sq = 6.25
        if (distSq > 0 && distSq < 6.25) {
          const dist = Math.sqrt(distSq);
          const push = new THREE.Vector3().subVectors(d1.position, d2.position).normalize();
          push.divideScalar(dist);
          separation.add(push);
          neighbors++;
        }
      }

      if (neighbors > 0) {
        separation.divideScalar(neighbors).multiplyScalar(20 * delta);
        d1.velocity.add(separation);
      }

      d1.velocity.clampLength(0, DRONE_SPEED);
      d1.position.add(d1.velocity.clone().multiplyScalar(delta));
    }

    // --- 3. RENDER SYSTEM ---
    let i = 0;
    for (const drone of dronesArchetype) {
      dummy.position.copy(drone.position);

      if (drone.velocity && drone.velocity.lengthSq() > 0.1) {
        dummy.lookAt(drone.position.clone().add(drone.velocity));
      }

      dummy.scale.set(0.3, 0.3, 0.5);
      dummy.updateMatrix();
      droneMeshRef.current.setMatrixAt(i, dummy.matrix);

      // Cargo
      if (drone.carryingType) {
        dummyCargo.position.copy(drone.position).add(new THREE.Vector3(0, -0.4, 0));
        dummyCargo.rotation.copy(dummy.rotation);
        dummyCargo.scale.set(0.25, 0.25, 0.25);
        dummyCargo.updateMatrix();
        cargoMeshRef.current.setMatrixAt(i, dummyCargo.matrix);

        const colorHex = BLOCK_COLORS[drone.carryingType] || '#ffffff';
        cargoMeshRef.current.setColorAt(i, new THREE.Color(colorHex));
      } else {
        dummyCargo.scale.set(0, 0, 0); // Hide
        dummyCargo.updateMatrix();
        cargoMeshRef.current.setMatrixAt(i, dummyCargo.matrix);
      }

      i++;
    }

    droneMeshRef.current.count = i;
    droneMeshRef.current.instanceMatrix.needsUpdate = true;

    cargoMeshRef.current.count = i;
    cargoMeshRef.current.instanceMatrix.needsUpdate = true;
    if (cargoMeshRef.current.instanceColor) cargoMeshRef.current.instanceColor.needsUpdate = true;

    // --- 4. PARTICLE SYSTEM (Legacy) ---
    if (particleMeshRef.current) {
      particles.current.forEach((p, idx) => {
        if (p.active) {
          p.life -= delta;
          p.velocity.multiplyScalar(0.95);
          p.position.addScaledVector(p.velocity, delta);

          if (p.life <= 0) {
            p.active = false;
            dummyParticle.scale.set(0, 0, 0);
          } else {
            const s = p.life * 0.15;
            dummyParticle.position.copy(p.position);
            dummyParticle.scale.set(s, s, s);
            dummyParticle.rotation.x += delta * 5;
            dummyParticle.rotation.y += delta * 5;
          }
          dummyParticle.updateMatrix();
          particleMeshRef.current!.setMatrixAt(idx, dummyParticle.matrix);
          particleMeshRef.current!.setColorAt(idx, p.color);
        } else {
          dummyParticle.scale.set(0, 0, 0);
          dummyParticle.updateMatrix();
          particleMeshRef.current!.setMatrixAt(idx, dummyParticle.matrix);
        }
      });
      particleMeshRef.current.instanceMatrix.needsUpdate = true;
      if (particleMeshRef.current.instanceColor)
        particleMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={droneMeshRef}
        args={[undefined, undefined, droneCount]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.5} />
      </instancedMesh>

      {/* Cargo Mesh */}
      <instancedMesh
        ref={cargoMeshRef}
        args={[undefined, undefined, droneCount]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>

      <instancedMesh
        ref={particleMeshRef}
        args={[undefined, undefined, MAX_PARTICLES]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
