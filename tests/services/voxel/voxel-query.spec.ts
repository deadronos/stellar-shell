import { describe, it, expect } from 'vitest';
import { VoxelQuery } from '../../../src/services/voxel/VoxelQuery';
import { BlockType } from '../../../src/types';
import { IVoxelSource } from '../../../src/services/voxel/types';
import * as THREE from 'three';
import type { Entity } from '../../../src/ecs/world';

describe('VoxelQuery', () => {
  // Mock world with a single block at 5,5,5
  const mockVoxelSource: IVoxelSource = {
    getBlock: (x: number, y: number, z: number) => {
      if (x === 5 && y === 5 && z === 5) return BlockType.ASTEROID_SURFACE;
      if (x === 10 && y === 10 && z === 10) return BlockType.FRAME;
      return BlockType.AIR;
    },
  };

  it('findBlueprints finds framework blocks', () => {
    const chunkEntities: Entity[] = [
      { chunkPosition: { x: 0, y: 0, z: 0 }, position: new THREE.Vector3(0, 0, 0) },
      { chunkPosition: { x: 1, y: 1, z: 1 }, position: new THREE.Vector3(16, 16, 16) },
    ];

    const blueprints = VoxelQuery.findBlocksByType(chunkEntities, mockVoxelSource, BlockType.FRAME);

    expect(blueprints).toContainEqual({ x: 10, y: 10, z: 10 });
  });

  it('findMiningTargets finds exposed asteroids', () => {
    const chunkEntities: Entity[] = [
      { chunkPosition: { x: 0, y: 0, z: 0 }, position: new THREE.Vector3(0, 0, 0) },
    ];

    const targets = VoxelQuery.findMiningTargets(chunkEntities, mockVoxelSource);
    // 5,5,5 is ASTEROID_SURFACE.
    // It has neighbors which are AIR (default mock).
    // So it is exposed.

    expect(targets).toContainEqual({ x: 5, y: 5, z: 5 });
  });

  describe('isChunkCompletedDyson', () => {
    it('returns false for an empty (all-AIR) chunk', () => {
      const emptySource: IVoxelSource = { getBlock: () => BlockType.AIR };
      expect(VoxelQuery.isChunkCompletedDyson(0, 0, 0, emptySource)).toBe(false);
    });

    it('returns true when all solid voxels in the chunk are PANEL', () => {
      const panelSource: IVoxelSource = {
        getBlock: (x, y, z) =>
          x === 0 && y === 0 && z === 0 ? BlockType.PANEL : BlockType.AIR,
      };
      expect(VoxelQuery.isChunkCompletedDyson(0, 0, 0, panelSource)).toBe(true);
    });

    it('returns true when all solid voxels in the chunk are SHELL', () => {
      const shellSource: IVoxelSource = {
        getBlock: (x, y, z) =>
          x === 1 && y === 1 && z === 1 ? BlockType.SHELL : BlockType.AIR,
      };
      expect(VoxelQuery.isChunkCompletedDyson(0, 0, 0, shellSource)).toBe(true);
    });

    it('returns false when the chunk contains a FRAME block', () => {
      const mixedSource: IVoxelSource = {
        getBlock: (x, y, z) => {
          if (x === 0 && y === 0 && z === 0) return BlockType.PANEL;
          if (x === 1 && y === 0 && z === 0) return BlockType.FRAME;
          return BlockType.AIR;
        },
      };
      expect(VoxelQuery.isChunkCompletedDyson(0, 0, 0, mixedSource)).toBe(false);
    });

    it('returns false when the chunk contains an ASTEROID block', () => {
      const asteroidSource: IVoxelSource = {
        getBlock: (x, y, z) =>
          x === 2 && y === 2 && z === 2 ? BlockType.ASTEROID_SURFACE : BlockType.AIR,
      };
      expect(VoxelQuery.isChunkCompletedDyson(0, 0, 0, asteroidSource)).toBe(false);
    });

    it('only inspects voxels within the specified render chunk', () => {
      // Chunk (1,0,0) has a PANEL at world coord (16,0,0); chunk (0,0,0) is empty.
      const panelInChunk1: IVoxelSource = {
        getBlock: (x, y, z) =>
          x === 16 && y === 0 && z === 0 ? BlockType.PANEL : BlockType.AIR,
      };
      expect(VoxelQuery.isChunkCompletedDyson(0, 0, 0, panelInChunk1)).toBe(false);
      expect(VoxelQuery.isChunkCompletedDyson(1, 0, 0, panelInChunk1)).toBe(true);
    });
  });
});
