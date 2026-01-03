import { describe, it, expect } from 'vitest';
import { BvxEngine } from '../src/services/BvxEngine';
import { BlockType } from '../src/types';

describe('BvxEngine basic behaviors', () => {
  it('setBlock/getBlock marks render chunk dirty', () => {
    const engine = new BvxEngine();

    // default is AIR
    expect(engine.getBlock(1000, 1000, 1000)).toBe(BlockType.AIR);

    // set a block and verify
    engine.setBlock(0, 0, 0, BlockType.FRAME);
    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.FRAME);

    // verify render chunk created and marked dirty
    const { cx, cy, cz } = engine.worldToChunk(0, 0, 0);
    const key = `${cx},${cy},${cz}`;
    const chunk = engine.chunks.get(key);
    expect(chunk).toBeDefined();
    expect(chunk?.dirty).toBe(true);
  });

  it('generateChunkMesh returns non-empty buffers for a chunk with blocks', () => {
    const engine = new BvxEngine();
    engine.setBlock(0, 0, 0, BlockType.FRAME);
    const { cx, cy, cz } = engine.worldToChunk(0, 0, 0);
    const key = `${cx},${cy},${cz}`;
    const chunk = engine.chunks.get(key)!;

    const mesh = engine.generateChunkMesh(chunk);
    expect(mesh.positions.length).toBeGreaterThan(0);
    expect(mesh.normals.length).toBeGreaterThan(0);
    expect(mesh.colors.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
  });
});
