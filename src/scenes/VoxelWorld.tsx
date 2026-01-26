import React from 'react';
import { useEntities } from 'miniplex-react';
import { ECS } from '../ecs/world';
import { RenderChunk } from '../render/RenderChunk';

export const VoxelWorld = () => {
  // Subscribe to meshData to trigger re-renders when mesh changes
  const { entities } = useEntities(ECS.with('isChunk', 'chunkPosition', 'meshData'));

  return (
    <group>
      {entities.map((entity) => (
        <RenderChunk key={entity.chunkKey} entity={entity} />
      ))}
    </group>
  );
};
