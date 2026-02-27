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

    describe('Face Culling', () => {
        it('should cull faces against solid neighbors', () => {
            // Two adjacent blocks: one at (0,0,0), one at (1,0,0)
            // The face between them should be culled
            const source = {
                getBlock: (x: number, y: number, z: number) => {
                    if ((x === 0 && y === 0 && z === 0) || 
                        (x === 1 && y === 0 && z === 0)) {
                        return BlockType.ASTEROID_SURFACE;
                    }
                    return BlockType.AIR;
                }
            };

            const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, source);

            // With two blocks, we should have fewer faces than 12 (6+6)
            // Because the internal face should be culled
            // 2 blocks = max 12 faces, but one internal face culled = 10 faces
            // Each face = 4 vertices
            expect(mesh.positions.length).toBe(10 * 4 * 3);
        });

        it('should expose faces against air', () => {
            // Single block at corner (0,0,0) - all 6 faces should be visible
            const source = {
                getBlock: (x: number, y: number, z: number) => {
                    if (x === 0 && y === 0 && z === 0) return BlockType.ASTEROID_SURFACE;
                    return BlockType.AIR;
                }
            };

            const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, source);

            // 6 faces * 4 vertices * 3 coords = 72 positions
            expect(mesh.positions.length).toBe(6 * 4 * 3);
            // 6 faces * 6 indices (2 triangles each) = 36 indices
            expect(mesh.indices.length).toBe(6 * 6);
        });

        it('should handle single block at chunk center correctly', () => {
            // Block at center of chunk (8, 8, 8) - surrounded by air in chunk, 
            // but we need to test boundary behavior
            const source = {
                getBlock: (x: number, y: number, z: number) => {
                    if (x === 8 && y === 8 && z === 8) return BlockType.ASTEROID_SURFACE;
                    return BlockType.AIR;
                }
            };

            const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, source);

            // Should have 6 exposed faces
            expect(mesh.positions.length).toBe(6 * 4 * 3);
            expect(mesh.indices.length).toBe(6 * 6);
        });
    });

    describe('Transparency', () => {
        it('should not render faces between two transparent blocks', () => {
            const source = {
                getBlock: (x: number, y: number, z: number) => {
                    // Two adjacent transparent frame blocks
                    if ((x === 0 && y === 0 && z === 0) || 
                        (x === 1 && y === 0 && z === 0)) {
                        return BlockType.FRAME;
                    }
                    return BlockType.AIR;
                }
            };

            const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, source);

            // Internal face should be culled (same transparent type)
            // 2 blocks = 10 faces expected
            expect(mesh.positions.length).toBe(10 * 4 * 3);
        });
    });
});
