import { describe, it, expect } from 'vitest';
import { VoxelMesher } from '../../src/mesher/VoxelMesher';
import { BlockType } from '../../src/types';

describe('VoxelMesher', () => {
    // Mock Voxel Source
    const createMockSource = (blockType: BlockType) => ({
        getBlock: () => blockType,
    });

    it('should generate empty mesh for air chunk', () => {
        const source = createMockSource(BlockType.AIR);
        const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, source);

        expect(mesh.positions.length).toBe(0);
        expect(mesh.normals.length).toBe(0);
        expect(mesh.colors.length).toBe(0);
        expect(mesh.indices.length).toBe(0);
    });

    it('should generate mesh for solid chunk (surrounded by air)', () => {
        // A single block at 0,0,0
        const source = {
            getBlock: (x: number, y: number, z: number) => {
                // Return solid block only at local 0,0,0 of the chunk we are meshing?
                // The mesher usually queries world coordinates.
                // If chunk is at 0,0,0 (cx=0, cy=0, cz=0), then world coords 0..15 are inside.
                // Let's assume we want a single block at 0,0,0
                if (x === 0 && y === 0 && z === 0) return BlockType.ASTEROID_SURFACE;
                return BlockType.AIR;
            }
        };

        const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, source);

        // Should have 6 faces, 2 tris each = 12 triangles.
        // Vertices logic depends on implementation (shared or not).
        // The existing implementation adds 4 vertices per face (non-indexed unique vertices per face usually, or indexed quads).
        // Let's check if it produces *something*.
        expect(mesh.positions.length).toBeGreaterThan(0);
        expect(mesh.indices.length).toBeGreaterThan(0);
    });
});
