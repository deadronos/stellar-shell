import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { BLOCK_COLORS } from '../constants';
import { ECS } from '../ecs/world';
import { ParticleSystemRenderer } from '../components/renderers/ParticleSystemRenderer';
import { LaserRenderer } from '../components/renderers/LaserRenderer';

// Module-level scratch objects reused every frame to avoid per-drone allocation.
const _lookAtTarget = new THREE.Vector3();
const _cargoOffset = new THREE.Vector3(0, -0.4, 0);
const _cargoColor = new THREE.Color();

export const Drones = () => {
  const droneCount = useStore((state) => state.droneCount);
  const droneMeshRef = useRef<THREE.InstancedMesh>(null);
  const cargoMeshRef = useRef<THREE.InstancedMesh>(null);

  // Reuse ThreeJS objects
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dummyCargo = useMemo(() => new THREE.Object3D(), []);

  // Archetypes
  const dronesArchetype = useMemo(() => ECS.with('isDrone', 'position', 'velocity'), []);

  useFrame(() => {
    if (!droneMeshRef.current || !cargoMeshRef.current) return;

    let i = 0;
    for (const drone of dronesArchetype) {
      dummy.position.copy(drone.position);

      if (drone.velocity && drone.velocity.lengthSq() > 0.1) {
        _lookAtTarget.copy(drone.position).add(drone.velocity);
        dummy.lookAt(_lookAtTarget);
      }

      dummy.scale.set(0.3, 0.3, 0.5);
      dummy.updateMatrix();
      droneMeshRef.current.setMatrixAt(i, dummy.matrix);

      // Cargo
      if (drone.carryingType) {
        // ... (existing cargo logic)
        dummyCargo.position.copy(drone.position).add(_cargoOffset);
        dummyCargo.rotation.copy(dummy.rotation);
        dummyCargo.scale.set(0.25, 0.25, 0.25);
        dummyCargo.updateMatrix();
        cargoMeshRef.current.setMatrixAt(i, dummyCargo.matrix);

        const colorHex = BLOCK_COLORS[drone.carryingType] || '#ffffff';
        cargoMeshRef.current.setColorAt(i, _cargoColor.set(colorHex));
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

      <ParticleSystemRenderer />
      <LaserRenderer />
    </group>
  );
};
