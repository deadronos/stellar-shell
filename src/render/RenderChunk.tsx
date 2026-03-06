import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Entity } from '../ecs/world';
import { MeshUpdater } from '../mesher/MeshUpdater';

interface RenderChunkProps {
  entity: Entity;
}

export const RenderChunk: React.FC<RenderChunkProps> = ({ entity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  // Use state to hold the geometry instance so it's stable and safe to access in render
  const [geometry] = useState(() => new THREE.BufferGeometry());

  // React to meshData changes via useEffect
  useEffect(() => {
    if (entity.meshData) {
      MeshUpdater.updateGeometry(geometry, entity.meshData);
    }
  }, [entity.meshData, geometry]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh ref={meshRef} position={entity.position} geometry={geometry}>
      <meshStandardMaterial vertexColors roughness={0.7} metalness={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
};
