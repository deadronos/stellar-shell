import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';

export const ChunkSystem = () => {
    // Identify chunks that need updating
    const dirtyChunks = ECS.with('isChunk', 'chunkPosition', 'needsUpdate');

    for (const entity of dirtyChunks) {
        if (entity.needsUpdate) {
            const { x, y, z } = entity.chunkPosition;
            const engine = BvxEngine.getInstance();
            
            // Generate Mesh Data
            const { positions, normals, colors, indices } = engine.generateChunkMesh(x, y, z);
            
            // If empty, we can release the geometry or keep it null
            if (positions.length === 0) {
                 if (entity.geometry) {
                     entity.geometry.dispose();
                 }
                 ECS.removeComponent(entity, 'geometry');
            } else {
                // Update or Create Geometry
                let geometry = entity.geometry;
                if (!geometry) {
                    geometry = new THREE.BufferGeometry();
                    ECS.addComponent(entity, 'geometry', geometry);
                }

                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.setIndex(indices);
                
                geometry.computeBoundingSphere();
            }

            // Mark as updated
            entity.needsUpdate = false;
        }
    }
};
