import { describe, it, expect, vi, type Mock } from 'vitest';
import { VoxelGenerator } from '../../../src/services/voxel/VoxelGenerator';
import { BlockType } from '../../../src/types';
import { IVoxelModifier } from '../../../src/services/voxel/types';

describe('VoxelGenerator', () => {
  it('generateAsteroid calls setBlock with correct block types', () => {
    const modifierMock: IVoxelModifier = {
      setBlock: vi.fn(),
    };

    // Generate a small asteroid
    VoxelGenerator.generateAsteroid(0, 0, 0, 5, modifierMock);

    expect(modifierMock.setBlock).toHaveBeenCalled();
    // Verify that at least some calls used core or surface types
    const calls = (modifierMock.setBlock as Mock).mock.calls as unknown[][];
    const hasCore = calls.some((args) => (args[3] as unknown) === BlockType.ASTEROID_CORE);
    const hasSurface = calls.some((args) => (args[3] as unknown) === BlockType.ASTEROID_SURFACE);
    
    expect(hasCore || hasSurface).toBe(true);
  });
});
