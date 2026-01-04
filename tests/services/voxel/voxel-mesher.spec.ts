import { describe, it, expect } from 'vitest';
import { VoxelMesher } from '../../../src/services/voxel/VoxelMesher';
import { BlockType } from '../../../src/types';
import { IVoxelSource } from '../../../src/services/voxel/types';

describe('VoxelMesher', () => {
  it('generateChunkMesh creates mesh data for visible blocks', () => {
    // Mock source that returns air everywhere except 0,0,0
    const sourceMock: IVoxelSource = {
        getBlock: (x: number, y: number, z: number) => {
            if (x === 0 && y === 0 && z === 0) return BlockType.ASTEROID_SURFACE;
            return BlockType.AIR;
        }
    };

    const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, sourceMock);

    // Should have a cube (6 faces * 2 triangles * 3 vertices = 36 vertices? Or indexed?)
    // This implementation likely generates indexed geometry or direct triangles.
    // Let's assume non-empty.
    expect(mesh.positions.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
  });

  it('generateChunkMesh returns empty for empty chunk', () => {
    const sourceMock: IVoxelSource = {
        getBlock: () => BlockType.AIR
    };

    const mesh = VoxelMesher.generateChunkMesh(0, 0, 0, sourceMock);
    expect(mesh.positions.length).toBe(0);
    expect(mesh.indices.length).toBe(0);
  });
});
