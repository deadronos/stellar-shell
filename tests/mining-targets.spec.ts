import { describe, it, expect, beforeEach } from 'vitest';
import { BvxEngine } from '../src/services/BvxEngine';
import { ECS } from '../src/ecs/world';
import { BlockType } from '../src/types';

describe('Mining Targets Logic', () => {
  beforeEach(() => {
    ECS.clear();
  });

  it('should find mining targets after generating an asteroid', () => {
    const engine = new BvxEngine();
    engine.generateAsteroid(2, 0, 2, 5);

    const targets = engine.findMiningTargets(100);

    console.log(`Found ${targets.length} mining targets`);

    expect(targets.length).toBeGreaterThan(0);

    const first = targets[0];
    const block = engine.getBlock(first.x, first.y, first.z);
    expect([BlockType.ASTEROID_SURFACE, BlockType.ASTEROID_CORE, BlockType.RARE_ORE]).toContain(
      block,
    );
  });

  it('should include an exposed rare ore block as a mining target', () => {
    const engine = new BvxEngine();
    engine.setBlock(10, 10, 10, BlockType.RARE_ORE);

    const targets = engine.findMiningTargets(100);

    const rareTarget = targets.find((t) => t.x === 10 && t.y === 10 && t.z === 10);
    expect(rareTarget).toBeDefined();
    expect(engine.getBlock(10, 10, 10)).toBe(BlockType.RARE_ORE);
  });
});
