import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { BvxEngine } from '../services/BvxEngine';
import { BlockType } from '../types';
import { FRAME_COST, BLOCK_COLORS } from '../constants';

const ENGINE = BvxEngine.getInstance();
const DRONE_SPEED = 20; // Faster to compensate for return trips
const SEPARATION_DIST = 2.5;
const MAX_PARTICLES = 1000;
const HUB_POSITION = new THREE.Vector3(0, 0, 0);

interface DroneInstance {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  target: THREE.Vector3 | null;
  state: 'IDLE' | 'MOVING_TO_BUILD' | 'MOVING_TO_MINE' | 'RETURNING_RESOURCE';
  targetBlock: {x: number, y: number, z: number} | null;
  carryingType: BlockType | null;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  active: boolean;
}

export const Drones = () => {
  const droneCount = useStore(state => state.droneCount);
  const droneMeshRef = useRef<THREE.InstancedMesh>(null);
  const cargoMeshRef = useRef<THREE.InstancedMesh>(null);
  const particleMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Simulation State
  const droneData = useRef<DroneInstance[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyCargo = useMemo(() => new THREE.Object3D(), []);

  // Particle System
  const particles = useRef<Particle[]>([]);
  const particleCursor = useRef(0);
  const dummyParticle = useMemo(() => new THREE.Object3D(), []);

  // Initialize particles
  useMemo(() => {
      for (let i = 0; i < MAX_PARTICLES; i++) {
          particles.current.push({
              position: new THREE.Vector3(),
              velocity: new THREE.Vector3(),
              color: new THREE.Color(),
              life: 0,
              active: false
          });
      }
  }, []);

  const spawnExplosion = (position: THREE.Vector3, color: string, count: number = 8) => {
      const c = new THREE.Color(color);
      for(let i=0; i<count; i++) {
          const idx = particleCursor.current;
          const p = particles.current[idx];
          p.active = true;
          p.life = 1.0;
          p.position.copy(position).add(new THREE.Vector3(
              (Math.random() - 0.5),
              (Math.random() - 0.5),
              (Math.random() - 0.5)
          ));
          p.velocity.set(
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5
          );
          p.color.copy(c);
          
          particleCursor.current = (particleCursor.current + 1) % MAX_PARTICLES;
      }
  };

  // Initialize new drones
  if (droneData.current.length < droneCount) {
    for (let i = droneData.current.length; i < droneCount; i++) {
      droneData.current.push({
        position: new THREE.Vector3(0, 0, 0), // Spawn at sun
        velocity: new THREE.Vector3(0, 0, 0),
        target: null,
        state: 'IDLE',
        targetBlock: null,
        carryingType: null
      });
    }
  }

  useFrame((state, delta) => {
    // --- DRONE LOGIC ---
    if (droneMeshRef.current && cargoMeshRef.current) {
        // Lazy caches for frame-local engine queries
        let cachedBlueprints: {x: number, y: number, z: number}[] | null = null;
        let cachedMines: {x: number, y: number, z: number}[] | null = null;
        
        const getBlueprints = () => {
            if (!cachedBlueprints) cachedBlueprints = ENGINE.findBlueprints();
            return cachedBlueprints;
        }
        
        const getMines = () => {
            if (!cachedMines) cachedMines = ENGINE.findMiningTargets(droneCount + 20);
            return cachedMines;
        }
        
        const currentMatter = useStore.getState().matter;
        const addMatter = useStore.getState().addMatter;
        const consumeMatter = useStore.getState().consumeMatter;

        // Build a set of currently targeted blocks to prevent swarming
        const reservedBlocks = new Set<string>();
        for (const d of droneData.current) {
            // Only reserve if we are actively moving towards a block
            if ((d.state === 'MOVING_TO_BUILD' || d.state === 'MOVING_TO_MINE') && d.targetBlock) {
                reservedBlocks.add(`${d.targetBlock.x},${d.targetBlock.y},${d.targetBlock.z}`);
            }
        }

        droneData.current.forEach((drone, i) => {
          // 1. DECISION MAKING
          if (drone.state === 'IDLE') {
            const blueprints = getBlueprints();
            const canBuild = currentMatter >= FRAME_COST;
            
            let bestTarget: {x:number, y:number, z:number} | null = null;
            let minDistSq = Infinity;
            let targetType: 'BUILD' | 'MINE' | null = null;

            const findClosest = (list: {x:number, y:number, z:number}[], type: 'BUILD' | 'MINE') => {
                for(const item of list) {
                    const key = `${item.x},${item.y},${item.z}`;
                    if (reservedBlocks.has(key)) continue;

                    const dx = item.x - drone.position.x;
                    const dy = item.y - drone.position.y;
                    const dz = item.z - drone.position.z;
                    const dSq = dx*dx + dy*dy + dz*dz;
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
                 const t = bestTarget as {x:number, y:number, z:number};
                 drone.target = new THREE.Vector3(t.x, t.y, t.z);
                 drone.targetBlock = t;
                 drone.state = targetType === 'BUILD' ? 'MOVING_TO_BUILD' : 'MOVING_TO_MINE';
                 
                 // Carrying Visuals
                 if (targetType === 'BUILD') {
                    drone.carryingType = BlockType.FRAME; // Visually carry the construction material
                 } else {
                    drone.carryingType = null; // Going empty to mine
                 }

                 reservedBlocks.add(`${t.x},${t.y},${t.z}`);
            } else {
                 // Dynamic Orbit
                 const time = state.clock.elapsedTime * 0.1 + (i * 0.137); 
                 const radius = 30 + Math.sin(time * 2.0) * 5;
                 const height = Math.sin(time * 0.5 + i) * 15;
                 drone.target = new THREE.Vector3(
                    Math.cos(time + i) * radius,
                    height,
                    Math.sin(time + i) * radius
                 );
            }
          }

          // 2. MOVEMENT & PHYSICS
          if (drone.target) {
             const distToTarget = drone.position.distanceTo(drone.target);
             const isOrbiting = drone.state === 'IDLE'; 

             // Arrival Check
             if (!isOrbiting && distToTarget < 1.5) {
                 // Build Logic
                 if (drone.state === 'MOVING_TO_BUILD' && drone.targetBlock) {
                     const {x,y,z} = drone.targetBlock;
                     if (ENGINE.getBlock(x,y,z) === BlockType.FRAME) {
                         if (consumeMatter(FRAME_COST)) {
                            ENGINE.setBlock(x,y,z, BlockType.PANEL);
                            spawnExplosion(drone.target, '#00d0ff', 12);
                         }
                     }
                     drone.state = 'IDLE';
                     drone.target = null;
                     drone.targetBlock = null;
                     drone.carryingType = null;
                 
                 // Mine Logic
                 } else if (drone.state === 'MOVING_TO_MINE' && drone.targetBlock) {
                     const {x,y,z} = drone.targetBlock;
                     const block = ENGINE.getBlock(x,y,z);
                     if (block === BlockType.ASTEROID_SURFACE || block === BlockType.ASTEROID_CORE) {
                         // Destroy block
                         ENGINE.setBlock(x,y,z, BlockType.AIR);
                         spawnExplosion(drone.target, '#888888', 8);
                         
                         // Pick up resource
                         drone.carryingType = block;
                         drone.state = 'RETURNING_RESOURCE';
                         
                         // Return to Hub (approximate location)
                         drone.target = HUB_POSITION.clone().add(new THREE.Vector3(
                             (Math.random() - 0.5) * 8, 
                             (Math.random() - 0.5) * 4, 
                             (Math.random() - 0.5) * 8
                         ));
                         drone.targetBlock = null; // Clear target block so we don't reserve it
                     } else {
                         // Failed (stolen?), go idle
                         drone.state = 'IDLE';
                         drone.target = null;
                         drone.targetBlock = null;
                     }
                
                 // Return Logic
                 } else if (drone.state === 'RETURNING_RESOURCE') {
                     // Deposit
                     if (drone.carryingType === BlockType.ASTEROID_CORE) addMatter(2);
                     else addMatter(1);

                     drone.carryingType = null;
                     drone.state = 'IDLE';
                     drone.target = null;
                 }
                 
                 drone.velocity.multiplyScalar(0.5); 
             } else {
                 // Steering
                 const desired = new THREE.Vector3().subVectors(drone.target, drone.position);
                 const dist = desired.length();
                 desired.normalize();
                 
                 if (!isOrbiting && dist < 5) {
                     desired.multiplyScalar(DRONE_SPEED * (dist / 5));
                 } else {
                     desired.multiplyScalar(DRONE_SPEED);
                 }
                 
                 const steer = new THREE.Vector3().subVectors(desired, drone.velocity);
                 // Fix: clampLength expects 2 arguments (min, max)
                 steer.clampLength(0, 35 * delta); 
                 drone.velocity.add(steer);

                 // Separation
                 const separation = new THREE.Vector3();
                 let count = 0;
                 for(let j=0; j<droneCount; j++) {
                     if (i === j) continue;
                     const other = droneData.current[j];
                     const d = drone.position.distanceTo(other.position);
                     if (d > 0 && d < SEPARATION_DIST) {
                         const push = new THREE.Vector3().subVectors(drone.position, other.position).normalize();
                         push.divideScalar(d); 
                         separation.add(push);
                         count++;
                     }
                 }
                 if (count > 0) {
                     separation.divideScalar(count).multiplyScalar(20 * delta);
                     drone.velocity.add(separation);
                 }

                 // Fix: clampLength expects 2 arguments (min, max)
                 drone.velocity.clampLength(0, DRONE_SPEED);
                 drone.position.add(drone.velocity.clone().multiplyScalar(delta));
             }
          }

          // Update Matrices
          dummy.position.copy(drone.position);
          if (drone.velocity.lengthSq() > 0.1) {
              const lookTarget = drone.position.clone().add(drone.velocity);
              dummy.lookAt(lookTarget);
          } else if (drone.target) {
              dummy.lookAt(drone.target);
          }
          dummy.scale.set(0.3, 0.3, 0.5);
          dummy.updateMatrix();
          droneMeshRef.current.setMatrixAt(i, dummy.matrix);

          // Update Cargo Matrix
          if (drone.carryingType) {
              // Position cargo slightly below the drone
              dummyCargo.position.copy(drone.position).add(new THREE.Vector3(0, -0.4, 0));
              dummyCargo.rotation.copy(dummy.rotation);
              dummyCargo.scale.set(0.25, 0.25, 0.25);
              dummyCargo.updateMatrix();
              cargoMeshRef.current.setMatrixAt(i, dummyCargo.matrix);
              
              // Set color based on block type
              const colorHex = BLOCK_COLORS[drone.carryingType] || '#ffffff';
              const col = new THREE.Color(colorHex);
              cargoMeshRef.current.setColorAt(i, col);
          } else {
              dummyCargo.scale.set(0, 0, 0);
              dummyCargo.updateMatrix();
              cargoMeshRef.current.setMatrixAt(i, dummyCargo.matrix);
          }
        });

        droneMeshRef.current.instanceMatrix.needsUpdate = true;
        
        cargoMeshRef.current.instanceMatrix.needsUpdate = true;
        if (cargoMeshRef.current.instanceColor) cargoMeshRef.current.instanceColor.needsUpdate = true;
    }

    // --- PARTICLE LOGIC ---
    if (particleMeshRef.current) {
        particles.current.forEach((p, i) => {
            if (p.active) {
                p.life -= delta;
                p.velocity.multiplyScalar(0.95); 
                p.position.addScaledVector(p.velocity, delta);
                
                if (p.life <= 0) {
                    p.active = false;
                    dummyParticle.scale.set(0,0,0);
                } else {
                    const s = p.life * 0.15;
                    dummyParticle.position.copy(p.position);
                    dummyParticle.scale.set(s, s, s);
                    dummyParticle.rotation.x += delta * 5;
                    dummyParticle.rotation.y += delta * 5;
                }
                
                dummyParticle.updateMatrix();
                particleMeshRef.current!.setMatrixAt(i, dummyParticle.matrix);
                particleMeshRef.current!.setColorAt(i, p.color);
            } else {
                 dummyParticle.scale.set(0,0,0); 
                 dummyParticle.updateMatrix();
                 particleMeshRef.current!.setMatrixAt(i, dummyParticle.matrix);
            }
        });
        particleMeshRef.current.instanceMatrix.needsUpdate = true;
        if (particleMeshRef.current.instanceColor) particleMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
        <instancedMesh ref={droneMeshRef} args={[undefined, undefined, droneCount]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.5} />
        </instancedMesh>
        
        {/* Cargo Mesh */}
        <instancedMesh ref={cargoMeshRef} args={[undefined, undefined, droneCount]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.5} />
        </instancedMesh>

        <instancedMesh ref={particleMeshRef} args={[undefined, undefined, MAX_PARTICLES]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    </group>
  );
};