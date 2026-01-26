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
});
