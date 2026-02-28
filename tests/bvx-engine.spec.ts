import { describe, it, expect, beforeEach } from 'vitest';
import { BvxEngine } from '../src/services/BvxEngine';
import { BlockType } from '../src/types';
import { ECS } from '../src/ecs/world';
import { PANEL_ENERGY_RATE, SHELL_ENERGY_RATE } from '../src/constants';
import { BlueprintManager } from '../src/services/BlueprintManager';

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
    BlueprintManager.getInstance().resetForTests();
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

  it('computeEnergyRate returns 0 for empty world', () => {
    const engine = new BvxEngine();
    expect(engine.computeEnergyRate()).toBe(0);
  });

  it('computeEnergyRate counts PANEL blocks correctly', () => {
    const engine = new BvxEngine();
    engine.setBlock(0, 0, 0, BlockType.PANEL);
    engine.setBlock(1, 0, 0, BlockType.PANEL);
    expect(engine.computeEnergyRate()).toBe(2 * PANEL_ENERGY_RATE);
  });

  it('computeEnergyRate counts SHELL blocks correctly', () => {
    const engine = new BvxEngine();
    engine.setBlock(0, 0, 0, BlockType.SHELL);
    expect(engine.computeEnergyRate()).toBe(SHELL_ENERGY_RATE);
  });

  it('computeEnergyRate reflects world state after block removal', () => {
    const engine = new BvxEngine();
    engine.setBlock(0, 0, 0, BlockType.PANEL);
    engine.setBlock(1, 0, 0, BlockType.SHELL);
    expect(engine.computeEnergyRate()).toBe(PANEL_ENERGY_RATE + SHELL_ENERGY_RATE);

    engine.setBlock(0, 0, 0, BlockType.AIR);
    expect(engine.computeEnergyRate()).toBe(SHELL_ENERGY_RATE);

    engine.setBlock(1, 0, 0, BlockType.AIR);
    expect(engine.computeEnergyRate()).toBe(0);
  });

  it('generates dyson sphere blueprint nodes around origin as ghost build targets', () => {
    const engine = new BvxEngine();
    const blueprints = BlueprintManager.getInstance().getBlueprints();

    expect(blueprints.length).toBeGreaterThan(0);
    for (const blueprint of blueprints) {
      const distance = Math.hypot(blueprint.x, blueprint.y, blueprint.z);
      expect(distance).toBeGreaterThanOrEqual(22);
      expect(distance).toBeLessThanOrEqual(26);
      expect(engine.getBlock(blueprint.x, blueprint.y, blueprint.z)).toBe(BlockType.BLUEPRINT_FRAME);
    }
  });

  it('computeDysonProgress counts dyson construction states and milestones from world state', () => {
    const engine = new BvxEngine();
    engine.resetWorld();

    engine.setBlock(0, 0, 0, BlockType.BLUEPRINT_FRAME);
    engine.setBlock(1, 0, 0, BlockType.FRAME);
    engine.setBlock(2, 0, 0, BlockType.PANEL);
    engine.setBlock(3, 0, 0, BlockType.SHELL);

    const progress = engine.computeDysonProgress();
    expect(progress.blueprintFrames).toBe(1);
    expect(progress.frames).toBe(1);
    expect(progress.panels).toBe(1);
    expect(progress.shells).toBe(1);
    expect(progress.milestones).toBe(3);
    expect(progress.prestigeReady).toBe(false);
  });

  it('computeWorldDerivedMetrics returns energy and dyson progress from one world snapshot', () => {
    const engine = new BvxEngine();
    engine.resetWorld();

    engine.setBlock(0, 0, 0, BlockType.BLUEPRINT_FRAME);
    engine.setBlock(1, 0, 0, BlockType.FRAME);
    engine.setBlock(2, 0, 0, BlockType.PANEL);
    engine.setBlock(3, 0, 0, BlockType.SHELL);

    const metrics = engine.computeWorldDerivedMetrics();
    expect(metrics.energyRate).toBe(PANEL_ENERGY_RATE + SHELL_ENERGY_RATE);
    expect(metrics.dysonProgress.blueprintFrames).toBe(1);
    expect(metrics.dysonProgress.frames).toBe(1);
    expect(metrics.dysonProgress.panels).toBe(1);
    expect(metrics.dysonProgress.shells).toBe(1);
    expect(metrics.dysonProgress.milestones).toBe(3);
    expect(metrics.dysonProgress.prestigeReady).toBe(false);
  });
});
