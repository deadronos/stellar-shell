import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { BLOCK_COLORS } from '../constants';
import { ECS } from '../ecs/world';
import { ParticleEvents } from '../services/ParticleEvents';

const MAX_PARTICLES = 1000;

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

  // Reuse ThreeJS objects
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyCargo = useMemo(() => new THREE.Object3D(), []);
  const dummyParticle = useMemo(() => new THREE.Object3D(), []);

  // Particle System (Legacy Array-based for now)
  const particles = useRef<Particle[]>([]);

  // Initialize particles
  // Initialize particles & subscribe to events
  useMemo(() => {
    // Fill pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.current.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        active: false,
      });
    }

    // Subscribe
    return ParticleEvents.subscribe((pos, color, count = 1) => {
      let spawned = 0;
      for (const p of particles.current) {
        if (!p.active) {
            p.active = true;
            p.position.copy(pos);
            // Random velocity spray
            const rx = Math.random() - 0.5;
            const ry = Math.random() - 0.5;
            const rz = Math.random() - 0.5;
            p.velocity.set(rx * 5, ry * 5, rz * 5);
            
            p.color.copy(color);
            const rLife = Math.random();
            p.life = 0.5 + rLife * 0.5;
            spawned++;
            if (spawned >= count) break;
        }
      }
    });

  }, []);

  // Archetypes
  const dronesArchetype = useMemo(() => ECS.with('isDrone', 'position', 'velocity'), []);

  // Laser Lines Geometry
  // We'll use a simple BufferGeometry for lines, updating positions every frame
  const laserGeo = useMemo(() => {
      const geo = new THREE.BufferGeometry();
      // Max 1000 lines?
      const positions = new Float32Array(1000 * 2 * 3); // 2 points per line
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return geo;
  }, []);
  const laserRef = useRef<THREE.LineSegments>(null);

  useFrame((state, delta) => {
    if (!droneMeshRef.current || !cargoMeshRef.current) return;

    // --- RENDER SYSTEM ---
    // Logic is now handled by SystemRunner -> MovementSystem / BrainSystem

    let i = 0;
    let laserIdx = 0;
    const laserPositions = laserGeo.attributes.position.array as Float32Array;

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
      
      // Update Laser
      if ((drone.state === 'MOVING_TO_MINE' || drone.state === 'MOVING_TO_BUILD') && drone.targetBlock) {
          const dist = drone.position.distanceTo(new THREE.Vector3(drone.targetBlock.x, drone.targetBlock.y, drone.targetBlock.z));
          // Show laser if close enough
          if (dist < 3) {
             const idx = laserIdx * 6; // 2 points * 3 coords
             laserPositions[idx] = drone.position.x;
             laserPositions[idx+1] = drone.position.y;
             laserPositions[idx+2] = drone.position.z;
             
             laserPositions[idx+3] = drone.targetBlock.x;
             laserPositions[idx+4] = drone.targetBlock.y;
             laserPositions[idx+5] = drone.targetBlock.z;
             
             laserIdx++;
          }
      }

      i++;
    }

    droneMeshRef.current.count = i;
    droneMeshRef.current.instanceMatrix.needsUpdate = true;

    cargoMeshRef.current.count = i;
    cargoMeshRef.current.instanceMatrix.needsUpdate = true;
    if (cargoMeshRef.current.instanceColor) cargoMeshRef.current.instanceColor.needsUpdate = true;
    
    // Update Lasers
    if (laserRef.current) {
        laserGeo.setDrawRange(0, laserIdx * 2);
        laserGeo.attributes.position.needsUpdate = true;
    }

    // --- PARTICLE SYSTEM (Legacy - Visual Only) ---
    // Note: To fully decouple, particles should probably be entities too, but for visual effects 
    // keeping them transient in the renderer is acceptable for now.
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
      
      {/* Lasers */}
      <lineSegments ref={laserRef} geometry={laserGeo} frustumCulled={false}>
          <lineBasicMaterial color="#00ffff" opacity={0.5} transparent />
      </lineSegments>
    </group>
  );
};
