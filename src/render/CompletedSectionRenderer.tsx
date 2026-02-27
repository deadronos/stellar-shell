import React, { useRef, useEffect, useMemo } from 'react';
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
 * Completed sections never change after construction, so we render them
 * with a static geometry that is only rebuilt on the one-time transition
 * from active → completed.  All instances share `completedSectionMaterial`,
 * reducing draw calls compared to the per-chunk `RenderChunk` path.
 *
 * Performance vs. `RenderChunk`:
 *  - Shared material → fewer state changes per frame.
 *  - `FrontSide` culling → GPU skips back faces of dense shell geometry.
 *  - `needsUpdate` propagation is suppressed once classified, so the
 *    mesher worker pool is idle for completed regions during late-game.
 */
export const CompletedSectionRenderer: React.FC<CompletedSectionRendererProps> = ({ entity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.BufferGeometry(), []);

  useEffect(() => {
    if (entity.meshData) {
      MeshUpdater.updateGeometry(geometry, entity.meshData);
    }
    return () => {
      geometry.dispose();
    };
  }, [entity.meshData, geometry]);

  return (
    <mesh
      ref={meshRef}
      position={entity.position}
      geometry={geometry}
      material={completedSectionMaterial}
    />
  );
};
