import React from 'react';
import { useEntities } from 'miniplex-react';
import { ECS } from '../ecs/world';
import { RenderChunk } from '../render/RenderChunk';

export const VoxelWorld = () => {
    // We now subscribe to 'meshData' or just 'isChunk'
    // RenderChunk handles updating geometry from meshData.
  const { entities } = useEntities(ECS.with('isChunk', 'chunkPosition'));

  return (
    <group>
      {entities.map((entity) => (
        <RenderChunk key={entity.chunkKey} entity={entity} />
      ))}
    </group>
  );
};
