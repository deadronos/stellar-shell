import { describe, it, expect, beforeEach } from 'vitest';
import { BvxEngine } from '../src/services/BvxEngine';
import { BlockType } from '../src/types';
import { ECS } from '../src/ecs/world';

describe('BvxEngine basic behaviors', () => {
  beforeEach(() => {
    // Clear ECS entities
    // Miniplex World allows iterating entities directly or we can use a loop
    // ECS.entities is readable
    // To clear safely:
    const entities = [...ECS.entities];
    for (const entity of entities) {
        ECS.remove(entity);
    }
  });

  it('setBlock/getBlock marks render chunk entity dirty', () => {
    // Note: Singleton usage in app, but new instance here works if it shares the global ECS
    // Wait, BvxEngine.getInstance() is what the app uses. new BvxEngine() works too but has its own bvxWorld.
    // The BvxEngine we refactored uses the global ECS.
    const engine = new BvxEngine();

    // default is AIR
    expect(engine.getBlock(1000, 1000, 1000)).toBe(BlockType.AIR);

    // set a block and verify
    engine.setBlock(0, 0, 0, BlockType.FRAME);
    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.FRAME);

    // verify chunk entity created and marked dirty
    const { cx, cy, cz } = engine.worldToChunk(0, 0, 0);
    const key = `${cx},${cy},${cz}`;

    // Query ECS
    // We can use ECS.with, but that's a query object.
    // Find manually
    const entity = ECS.entities.find((e) => e.chunkKey === key);
    
    expect(entity).toBeDefined();
    expect(entity?.isChunk).toBe(true);
    expect(entity?.needsUpdate).toBe(true);
  });

  it('generateChunkMesh returns non-empty buffers for a chunk with blocks', () => {
    const engine = new BvxEngine();
    engine.setBlock(0, 0, 0, BlockType.FRAME);
    const { cx, cy, cz } = engine.worldToChunk(0, 0, 0);
    
    const mesh = engine.generateChunkMesh(cx, cy, cz);
    expect(mesh.positions.length).toBeGreaterThan(0);
    expect(mesh.normals.length).toBeGreaterThan(0);
    expect(mesh.colors.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
  });
});
