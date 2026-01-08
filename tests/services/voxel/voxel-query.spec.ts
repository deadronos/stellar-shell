import { describe, it, expect } from 'vitest';
import { VoxelQuery } from '../../../src/services/voxel/VoxelQuery';
import { BlockType } from '../../../src/types';
import { IVoxelSource } from '../../../src/services/voxel/types';

describe('VoxelQuery', () => {
    // Mock world with a single block at 5,5,5
    const mockVoxelSource: IVoxelSource = {
        getBlock: (x: number, y: number, z: number) => {
            if (x === 5 && y === 5 && z === 5) return BlockType.ASTEROID_SURFACE;
            if (x === 10 && y === 10 && z === 10) return BlockType.FRAME;
            return BlockType.AIR;
        }
    };

    it('findBlueprints finds framework blocks', () => {
        const chunkEntities: { chunkPosition: { x: number; y: number; z: number } }[] = [
            { chunkPosition: { x: 0, y: 0, z: 0 } },
            { chunkPosition: { x: 1, y: 1, z: 1 } } // Contains 10,10,10 ?? 16+? No. 1*16 = 16.
            // 10,10,10 is in chunk 0,0,0
        ];

        const blueprints = VoxelQuery.findBlocksByType(chunkEntities, mockVoxelSource, BlockType.FRAME);
        // 10,10,10 is in chunk 0,0,0. (10/16 = 0)
        // Wait, loop iterates 0..15.
        // x=10, y=10, z=10 is 0*16 + 10 = 10.
        // So chunk 0,0,0 should find it.
        
        // But our test mock logic for getBlock is global coordinates?
        // Yes, VoxelQuery calls getBlock(wx, wy, wz).
        // wx = cx*16 + x.
        // For cx=0, wx = x (0..15).
        // So 10,10,10 is found.
        
        expect(blueprints).toContainEqual({ x: 10, y: 10, z: 10 });
    });

    it('findMiningTargets finds exposed asteroids', () => {
        const chunkEntities: { chunkPosition: { x: number; y: number; z: number } }[] = [
             { chunkPosition: { x: 0, y: 0, z: 0 } }
        ];

        const targets = VoxelQuery.findMiningTargets(chunkEntities, mockVoxelSource);
        // 5,5,5 is ASTEROID_SURFACE.
        // It has neighbors which are AIR (default mock).
        // So it is exposed.
        
        expect(targets).toContainEqual({ x: 5, y: 5, z: 5 });
    });
});
