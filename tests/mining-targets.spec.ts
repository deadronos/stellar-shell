import { describe, it, expect, beforeEach } from 'vitest';
import { BvxEngine } from '../src/services/BvxEngine';
import { ECS } from '../src/ecs/world';
import { BlockType } from '../src/types';

describe('Mining Targets Logic', () => {
  beforeEach(() => {
    // Reset ECS
    ECS.clear();
    // Reset Engine if possible, or just get instance (it's singleton)
    // BvxEngine.getInstance().resetWorld(); // Assuming resetWorld clears internal state
  });

  it('should find mining targets after generating an asteroid', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    // Generate valid asteroid at chunk (2,0,2) -> world (32, 0, 32)
    // Radius 5 ensure it fits in the chunk mostly
    engine.generateAsteroid(2, 0, 2, 5);

    // Verify blocks exist
    // Center of asteroid: 2*16 + 8 = 40
    // Actually generateAsteroid uses chunk coordinates for center?
    // BvxEngine.ts: generateAsteroid(cx, cy, cz, radius)
    // It likely calls VoxelGenerator which uses world coords or local? 
    // Usually (cx * 16 + 8, ...)
    
    // Let's just check if ANY targets are found.
    const targets = engine.findMiningTargets(100);
    
    console.log(`Found ${targets.length} mining targets`);
    
    expect(targets.length).toBeGreaterThan(0);
    
    const first = targets[0];
    const block = engine.getBlock(first.x, first.y, first.z);
    expect([BlockType.ASTEROID_SURFACE, BlockType.ASTEROID_CORE]).toContain(block);
  });
});
