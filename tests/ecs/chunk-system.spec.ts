import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { ChunkSystem } from '../../src/ecs/systems/ChunkSystem';
import { ECS } from '../../src/ecs/world';
import { BvxEngine } from '../../src/services/BvxEngine';

describe('ChunkSystem', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('manages chunk loading based on player position', () => {
        // Mock Engine
        const mockGenerate = vi.fn().mockReturnValue({
            positions: new Float32Array([0,0,0, 1,1,1, 2,2,2]),
            normals: new Float32Array([0,1,0, 0,1,0, 0,1,0]),
            colors: new Float32Array([1,1,1, 1,1,1, 1,1,1]),
            indices: [0, 1, 2]
        });

        const mockEngine = {
            generateChunkMesh: mockGenerate
        } as unknown as BvxEngine;

        vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine);

        // Create player
        const player = ECS.add({
            isPlayer: true,
            position: new THREE.Vector3(0, 0, 0),
            chunkPosition: { x: 0, y: 0, z: 0 },
            velocity: new THREE.Vector3(0, 0, 0)
        });
        
        // Add a dirty chunk needed by system
        // ChunkSystem iterates 'dirtyChunks̈́'
        const chunk = ECS.add({
            isChunk: true,
            chunkKey: '0,0,0',
            chunkPosition: { x: 0, y: 0, z: 0 },
            needsUpdate: true,
            position: new THREE.Vector3(0, 0, 0)
        });

        // Run system
        ChunkSystem();

        expect(mockGenerate).toHaveBeenCalled();
        expect(chunk.geometry).toBeDefined();

        ECS.remove(player);
        ECS.remove(chunk);
    });
});
