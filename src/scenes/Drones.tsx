import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { BLOCK_COLORS } from '../constants';
import { ECS } from '../ecs/world';

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

  // Archetypes
  const dronesArchetype = useMemo(() => ECS.with('isDrone', 'position', 'velocity'), []);

  useFrame((state, delta) => {
    if (!droneMeshRef.current || !cargoMeshRef.current) return;

    // --- RENDER SYSTEM ---
    // Logic is now handled by SystemRunner -> MovementSystem / BrainSystem

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
    </group>
  );
};
