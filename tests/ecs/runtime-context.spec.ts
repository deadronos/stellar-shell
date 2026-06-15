import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ECS } from '../../src/ecs/world';
import { createRuntimeContext, resetRuntimeContext } from '../../src/ecs/RuntimeContext';
import { BlockType } from '../../src/types';

describe('RuntimeContext', () => {
  beforeEach(() => {
    ECS.clear();
  });

  afterEach(() => {
    ECS.clear();
  });

  it('creates isolated engine and blueprint instances per context', () => {
    const ctxA = createRuntimeContext({ mesherWorkerCount: 0 });
    const ctxB = createRuntimeContext({ mesherWorkerCount: 0 });

    ctxA.engine.setBlock(1, 2, 3, BlockType.FRAME);
    ctxA.blueprints.addBlueprint({ x: 1, y: 2, z: 3 });

    expect(ctxB.engine.getBlock(1, 2, 3)).toBe(BlockType.AIR);
    expect(ctxB.blueprints.hasBlueprint({ x: 1, y: 2, z: 3 })).toBe(false);

    ctxA.mesherPool.dispose();
    ctxB.mesherPool.dispose();
  });

  it('resetRuntimeContext clears the engine world and blueprints for the given context', () => {
    const ctx = createRuntimeContext({ mesherWorkerCount: 0 });

    ctx.engine.setBlock(0, 0, 0, BlockType.FRAME);
    ctx.blueprints.addBlueprint({ x: 0, y: 0, z: 0 });

    resetRuntimeContext(ctx);

    expect(ctx.engine.getBlock(0, 0, 0)).toBe(BlockType.AIR);
    expect(ctx.blueprints.hasBlueprint({ x: 0, y: 0, z: 0 })).toBe(false);

    ctx.mesherPool.dispose();
  });

  it('does not pollute ECS chunk entities between isolated contexts', () => {
    const ctxA = createRuntimeContext({ mesherWorkerCount: 0 });
    ctxA.engine.setBlock(0, 0, 0, BlockType.FRAME);

    const chunkCountA = ECS.with('isChunk').entities.length;
    expect(chunkCountA).toBeGreaterThan(0);

    ECS.clear();

    const ctxB = createRuntimeContext({ mesherWorkerCount: 0 });
    ctxB.engine.setBlock(16, 0, 0, BlockType.PANEL);

    const chunks = ECS.with('isChunk').entities;
    expect(chunks.length).toBe(1);
    expect(chunks[0].chunkKey).toBe('1,0,0');

    ctxA.mesherPool.dispose();
    ctxB.mesherPool.dispose();
  });
});
