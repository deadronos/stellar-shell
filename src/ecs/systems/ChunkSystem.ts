import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';

export const ChunkSystem = () => {
    // Identify chunks that need updating
    const dirtyChunks = ECS.with('isChunk', 'chunkPosition', 'needsUpdate');

    for (const entity of [...dirtyChunks.entities]) {
        // Double check not strictly needed if query is correct, but safe.
        // Also TypeScript might want confirmation.
        if (entity.needsUpdate) {
            const { x, y, z } = entity.chunkPosition;
            const engine = BvxEngine.getInstance(); // Ensure instance

            // Generate Mesh Data
            const meshData = engine.generateChunkMesh(x, y, z);

            // Logic split: System produces DATA, Renderer consumes it.
            // We store the raw mesh data on the entity.
            // The renderer (RenderChunk) will pick this up and update the THREE.Geometry.
            ECS.addComponent(entity, 'meshData', meshData);

            // Mark as updated (Consume the dirty flag)
            // entity.needsUpdate = false; // <-- This doesn't notify miniplex
            ECS.removeComponent(entity, 'needsUpdate');
        }
    }
};
