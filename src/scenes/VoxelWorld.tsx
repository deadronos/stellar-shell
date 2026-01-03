import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEntities } from 'miniplex-react';
import { ECS, Entity } from '../ecs/world';

const ChunkRenderer: React.FC<{ entity: Entity }> = ({ entity }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && entity.geometry && meshRef.current.geometry !== entity.geometry) {
      meshRef.current.geometry = entity.geometry;
    }
  });

  if (!entity.geometry) return null;

  return (
    <mesh
      ref={meshRef}
      position={entity.position}
      geometry={entity.geometry}
    >
      {/* Enhanced Material for Space Rock look */}
      <meshStandardMaterial
        vertexColors
        roughness={0.7} // Slightly rougher to catch diffuse light
        metalness={0.1} // Low metalness ensures color visibility in dark environment
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const VoxelWorld = () => {
    // Subscribe to all entities that are chunks and have a geometry
    // Actually, we render them even if they might not have geometry yet (ChunkRenderer handles null check)
    // But it's cleaner to only render if geometry exists?
    // No, if we want to update it later, we need the component mounted.
    // So distinct chunks are enough.
  const { entities } = useEntities(ECS.with('isChunk', 'chunkPosition'));

  return (
    <group>
      {entities.map((entity) => (
        <ChunkRenderer key={entity.chunkKey} entity={entity} />
      ))}
    </group>
  );
};
