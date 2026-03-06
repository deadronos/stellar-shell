import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Entity } from '../ecs/world';
import { MeshUpdater } from '../mesher/MeshUpdater';

interface CompletedSectionRendererProps {
  entity: Entity;
}

/**
 * Shared material for all completed-section chunks.
 * Module-level singleton so all instances share a single draw-call material.
 */
const completedSectionMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.15,
  metalness: 0.9,
  side: THREE.FrontSide, // completed sections face outward only
});

/**
 * Renders a completed Dyson-sphere chunk using a static geometry and a
 * shared module-level material.
 *
 * Completed chunks still use the same reactive `meshData` update path as
 * frontier chunks. The optimization here is material sharing and front-face
 * culling, not immutability. All instances share `completedSectionMaterial`,
 * reducing state changes compared to the per-chunk `RenderChunk` path.
 *
 * Performance vs. `RenderChunk`:
 *  - Shared material → fewer state changes per frame.
 *  - `FrontSide` culling → GPU skips back faces of dense shell geometry.
 */
export const CompletedSectionRenderer: React.FC<CompletedSectionRendererProps> = ({ entity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  // Keep geometry identity stable for this component's lifetime.
  const [geometry] = useState(() => new THREE.BufferGeometry());

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
    <mesh
      ref={meshRef}
      position={entity.position}
      geometry={geometry}
      material={completedSectionMaterial}
    />
  );
};
