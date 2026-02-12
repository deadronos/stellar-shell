import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ChunkSystem } from '../../src/ecs/systems/ChunkSystem';
import { ECS } from '../../src/ecs/world';
import { BvxEngine } from '../../src/services/BvxEngine';
import * as MesherWorkerPool from '../../src/mesher/MesherWorkerPool';

describe('ChunkSystem', () => {
    let mockPool: {
        generateMesh: ReturnType<typeof vi.fn>;
        getQueueDepth: ReturnType<typeof vi.fn>;
        getActiveWorkerCount: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        // Mock the worker pool
        mockPool = {
            generateMesh: vi.fn().mockResolvedValue({
                taskId: 'test',
                positions: new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2]),
                normals: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]),
                colors: new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1]),
                indices: [0, 1, 2]
            }),
            getQueueDepth: vi.fn().mockReturnValue(0),
            getActiveWorkerCount: vi.fn().mockReturnValue(0)
        };

        vi.spyOn(MesherWorkerPool, 'getMesherPool').mockReturnValue(mockPool as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('manages chunk loading based on player position', async () => {
        // Mock Engine
        const mockEngine = {
            getBlock: () => 0
        } as unknown as BvxEngine;

        vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine);

        // Add a dirty chunk needed by system
        const chunk = ECS.add({
            isChunk: true,
            chunkKey: '0,0,0',
            chunkPosition: { x: 0, y: 0, z: 0 },
            needsUpdate: true,
            position: new THREE.Vector3(0, 0, 0)
        });

        // Run system
        ChunkSystem();

        // Should have dispatched job to worker pool
        expect(mockPool.generateMesh).toHaveBeenCalledWith(0, 0, 0, mockEngine);

        // Chunk should now be pending (not have meshData yet)
        expect(chunk.meshPending).toBe(true);
        expect(chunk.meshData).toBeUndefined();

        // Wait for async mesh generation
        await new Promise(resolve => setTimeout(resolve, 10));

        // Now meshData should be set
        expect(chunk.meshData).toBeDefined();
        expect(chunk.meshPending).toBeUndefined();

        ECS.remove(chunk);
    });
});
