import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BvxEngine } from '../services/BvxEngine';
import { CHUNK_SIZE } from '../constants';

const ChunkRenderer: React.FC<{ chunkKey: string; engine: BvxEngine }> = ({ chunkKey, engine }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const chunk = engine.chunks.get(chunkKey);
  const [version, setVersion] = useState(0); // Force re-render

  useLayoutEffect(() => {
    if (!chunk || !meshRef.current) return;

    // Check if dirty
    if (chunk.dirty) {
      const { positions, normals, colors, indices } = engine.generateChunkMesh(chunk);

      const geometry = meshRef.current.geometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setIndex(indices);

      geometry.computeBoundingSphere();
      chunk.dirty = false;
    }
  }, [version, chunk, engine]);

  // Poll for dirty state (simplified reactivity for game loop)
  useFrame((state) => {
    if (state.clock.elapsedTime % 0.5 < 0.1) {
      // Check periodically
      if (chunk && chunk.dirty) {
        setVersion((v) => v + 1);
      }
    }
  });

  if (!chunk) return null;

  return (
    <mesh
      ref={meshRef}
      position={[
        chunk.position.x * CHUNK_SIZE,
        chunk.position.y * CHUNK_SIZE,
        chunk.position.z * CHUNK_SIZE,
      ]}
    >
      <bufferGeometry />
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
  const engine = useMemo(() => BvxEngine.getInstance(), []);
  // In a real app we'd subscribe to chunk creation/deletion.
  // For this MVP, we assume a fixed set of initial chunks or re-render explicitly if key count changes.
  const [chunkKeys, setChunkKeys] = useState(Array.from(engine.chunks.keys()));

  useFrame((state) => {
    if (engine.chunks.size !== chunkKeys.length) {
      setChunkKeys(Array.from(engine.chunks.keys()));
    }
  });

  return (
    <group>
      {chunkKeys.map((key) => (
        <ChunkRenderer key={key} chunkKey={key} engine={engine} />
      ))}
    </group>
  );
};
