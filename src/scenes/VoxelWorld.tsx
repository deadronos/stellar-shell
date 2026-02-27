import React from 'react';
import { useEntities } from 'miniplex-react';
import { ECS } from '../ecs/world';
import { RenderChunk } from '../render/RenderChunk';
import { CompletedSectionRenderer } from '../render/CompletedSectionRenderer';

export const VoxelWorld = () => {
  // Active frontier chunks: voxel-interactive, per-voxel mesh
  const { entities: activeChunks } = useEntities(
    ECS.with('isChunk', 'chunkPosition', 'meshData').without('completedDysonSection'),
  );

  // Completed Dyson sections: use optimized aggregate renderer
  const { entities: completedChunks } = useEntities(
    ECS.with('isChunk', 'chunkPosition', 'meshData', 'completedDysonSection'),
  );

  return (
    <group>
      {activeChunks.map((entity) => (
        <RenderChunk key={entity.chunkKey} entity={entity} />
      ))}
      {completedChunks.map((entity) => (
        <CompletedSectionRenderer key={entity.chunkKey} entity={entity} />
      ))}
    </group>
  );
};
