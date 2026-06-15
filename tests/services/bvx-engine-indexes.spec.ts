import { describe, it, expect, beforeEach } from 'vitest';
import { BvxEngine } from '../../src/services/BvxEngine';
import { BlockType } from '../../src/types';
import { ECS } from '../../src/ecs/world';
import { BlueprintManager } from '../../src/services/BlueprintManager';

/**
 * Tests for the incremental spatial indexes added in issue #66.
 *
 * These verify that the exposedMines, buildableFrames, and buildablePanels
 * sets maintained by BvxEngine stay consistent after any sequence of
 * setBlock calls.
 */

describe('BvxEngine spatial indexes (issue #66)', () => {
  let engine: BvxEngine;

  beforeEach(() => {
    const entities = [...ECS.entities];
    for (const entity of entities) {
      ECS.remove(entity);
    }
    engine = new BvxEngine();
  });

  // ── Exposed Mines index ──────────────────────────────────────────────────

  describe('exposedMines index', () => {
    it('includes an exposed ASTEROID_SURFACE block', () => {
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_SURFACE);

      const targets = engine.findMiningTargets(100);
      expect(targets).toContainEqual({ x: 5, y: 5, z: 5 });
    });

    it('includes an exposed ASTEROID_CORE block', () => {
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_CORE);

      const targets = engine.findMiningTargets(100);
      expect(targets).toContainEqual({ x: 5, y: 5, z: 5 });
    });

    it('includes an exposed RARE_ORE block', () => {
      engine.setBlock(5, 5, 5, BlockType.RARE_ORE);

      const targets = engine.findMiningTargets(100);
      expect(targets).toContainEqual({ x: 5, y: 5, z: 5 });
    });

    it('excludes a mine-type block surrounded by solid neighbors (not exposed)', () => {
      // Surround (5,5,5) with solid blocks
      engine.setBlock(4, 5, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(6, 5, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 4, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 6, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 5, 4, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 5, 6, BlockType.ASTEROID_SURFACE);
      // The center block
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_CORE);

      const targets = engine.findMiningTargets(100);
      expect(targets.find((t) => t.x === 5 && t.y === 5 && t.z === 5)).toBeUndefined();
    });

    it('excludes non-mine block types', () => {
      engine.setBlock(5, 5, 5, BlockType.FRAME);
      engine.setBlock(6, 6, 6, BlockType.PANEL);
      engine.setBlock(7, 7, 7, BlockType.SHELL);

      expect(engine.findMiningTargets(100).length).toBe(0);
    });

    it('removes a block from indexes when it is changed to AIR', () => {
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_SURFACE);
      expect(engine.findMiningTargets(100)).toContainEqual({ x: 5, y: 5, z: 5 });

      engine.setBlock(5, 5, 5, BlockType.AIR);
      expect(engine.findMiningTargets(100).find((t) => t.x === 5 && t.y === 5 && t.z === 5)).toBeUndefined();
    });

    it('updates exposure when a neighboring block is removed (exposing a new mine)', () => {
      // Place a core block fully surrounded
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_CORE);
      engine.setBlock(4, 5, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(6, 5, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 4, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 6, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 5, 4, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 5, 6, BlockType.ASTEROID_SURFACE);

      expect(engine.findMiningTargets(100).find((t) => t.x === 5 && t.y === 5 && t.z === 5)).toBeUndefined();

      // Remove one neighbor — core becomes exposed
      engine.setBlock(4, 5, 5, BlockType.AIR);

      expect(engine.findMiningTargets(100)).toContainEqual({ x: 5, y: 5, z: 5 });
    });

    it('removes a mine from the index when it is no longer exposed', () => {
      // A mine with air neighbors is exposed
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_SURFACE);
      expect(engine.findMiningTargets(100)).toContainEqual({ x: 5, y: 5, z: 5 });

      // Fill the neighbor (4,5,5) with solid — (5,5,5) becomes buried
      engine.setBlock(4, 5, 5, BlockType.ASTEROID_SURFACE);

      // (5,5,5) still exposed through other faces
      // To fully bury it, fill all 6 neighbors
      engine.setBlock(6, 5, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 4, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 6, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 5, 4, BlockType.ASTEROID_SURFACE);
      engine.setBlock(5, 5, 6, BlockType.ASTEROID_SURFACE);

      // With the first neighbor already set, all 6 are solid
      expect(engine.findMiningTargets(100).find((t) => t.x === 5 && t.y === 5 && t.z === 5)).toBeUndefined();
    });

    it('considers FRAME as an exposing neighbor (drone can mine through frames)', () => {
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_CORE);
      engine.setBlock(4, 5, 5, BlockType.FRAME);

      const targets = engine.findMiningTargets(100);
      expect(targets).toContainEqual({ x: 5, y: 5, z: 5 });
    });
  });

  // ── Buildable Frames index (FRAME → PANEL) ──────────────────────────────

  describe('buildableFrames index', () => {
    it('finds FRAME blocks via findBlocksByType', () => {
      engine.setBlock(5, 5, 5, BlockType.FRAME);

      const frames = engine.findBlocksByType(BlockType.FRAME, 10);
      expect(frames).toContainEqual({ x: 5, y: 5, z: 5 });
    });

    it('does not find non-FRAME blocks', () => {
      engine.setBlock(5, 5, 5, BlockType.PANEL);
      engine.setBlock(6, 6, 6, BlockType.SHELL);
      engine.setBlock(7, 7, 7, BlockType.BLUEPRINT_FRAME);

      const frames = engine.findBlocksByType(BlockType.FRAME, 10);
      expect(frames.length).toBe(0);
    });

    it('removes a FRAME from the index when it is upgraded to PANEL', () => {
      engine.setBlock(5, 5, 5, BlockType.FRAME);
      expect(engine.findBlocksByType(BlockType.FRAME, 10)).toContainEqual({ x: 5, y: 5, z: 5 });

      engine.setBlock(5, 5, 5, BlockType.PANEL);
      expect(engine.findBlocksByType(BlockType.FRAME, 10).find((f) => f.x === 5 && f.y === 5 && f.z === 5)).toBeUndefined();
    });

    it('removes a FRAME from the index when it is removed', () => {
      engine.setBlock(5, 5, 5, BlockType.FRAME);
      engine.setBlock(5, 5, 5, BlockType.AIR);

      expect(engine.findBlocksByType(BlockType.FRAME, 10).length).toBe(0);
    });
  });

  // ── Buildable Panels index (PANEL → SHELL) ──────────────────────────────

  describe('buildablePanels index', () => {
    it('finds PANEL blocks via findBlocksByType', () => {
      engine.setBlock(5, 5, 5, BlockType.PANEL);

      const panels = engine.findBlocksByType(BlockType.PANEL, 10);
      expect(panels).toContainEqual({ x: 5, y: 5, z: 5 });
    });

    it('does not find non-PANEL blocks', () => {
      engine.setBlock(5, 5, 5, BlockType.SHELL);
      engine.setBlock(6, 6, 6, BlockType.FRAME);

      const panels = engine.findBlocksByType(BlockType.PANEL, 10);
      expect(panels.length).toBe(0);
    });

    it('removes a PANEL from the index when it is upgraded to SHELL', () => {
      engine.setBlock(5, 5, 5, BlockType.PANEL);
      expect(engine.findBlocksByType(BlockType.PANEL, 10)).toContainEqual({ x: 5, y: 5, z: 5 });

      engine.setBlock(5, 5, 5, BlockType.SHELL);
      expect(engine.findBlocksByType(BlockType.PANEL, 10).find((p) => p.x === 5 && p.y === 5 && p.z === 5)).toBeUndefined();
    });

    it('removes a PANEL from the index when it is removed', () => {
      engine.setBlock(5, 5, 5, BlockType.PANEL);
      engine.setBlock(5, 5, 5, BlockType.AIR);

      expect(engine.findBlocksByType(BlockType.PANEL, 10).length).toBe(0);
    });

    it('respects the limit when finding PANEL blocks', () => {
      // Place 5 PANEL blocks
      engine.setBlock(0, 0, 0, BlockType.PANEL);
      engine.setBlock(1, 0, 0, BlockType.PANEL);
      engine.setBlock(2, 0, 0, BlockType.PANEL);
      engine.setBlock(3, 0, 0, BlockType.PANEL);
      engine.setBlock(4, 0, 0, BlockType.PANEL);

      expect(engine.findBlocksByType(BlockType.PANEL, 3).length).toBe(3);
      expect(engine.findBlocksByType(BlockType.PANEL, 10).length).toBe(5);
      expect(engine.findBlocksByType(BlockType.PANEL, 0).length).toBe(0);
    });
  });

  // ── World Reset ─────────────────────────────────────────────────────────

  describe('world reset', () => {
    it('clears all indexes after resetWorld', () => {
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_SURFACE);
      engine.setBlock(10, 10, 10, BlockType.FRAME);
      engine.setBlock(15, 15, 15, BlockType.PANEL);

      expect(engine.findMiningTargets(10).length).toBeGreaterThan(0);
      expect(engine.findBlocksByType(BlockType.FRAME, 10).length).toBeGreaterThan(0);
      expect(engine.findBlocksByType(BlockType.PANEL, 10).length).toBeGreaterThan(0);

      const blueprints = new BlueprintManager();
      engine.resetWorld(blueprints);

      expect(engine.findMiningTargets(10).length).toBe(0);
      expect(engine.findBlocksByType(BlockType.FRAME, 10).length).toBe(0);
      expect(engine.findBlocksByType(BlockType.PANEL, 10).length).toBe(0);
    });

    it('indexes stay consistent after generating a new asteroid post-reset', () => {
      const blueprints = new BlueprintManager();
      engine.resetWorld(blueprints);

      engine.setBlock(5, 5, 5, BlockType.ASTEROID_SURFACE);

      expect(engine.findMiningTargets(10)).toContainEqual({ x: 5, y: 5, z: 5 });
    });
  });

  // ── Complex sequences ───────────────────────────────────────────────────

  describe('complex sequences', () => {
    it('handles a full lifecycle: mine → build frame → upgrade panel → upgrade shell', () => {
      // 1. Place an asteroid block
      engine.setBlock(5, 5, 5, BlockType.ASTEROID_SURFACE);
      expect(engine.findMiningTargets(10)).toContainEqual({ x: 5, y: 5, z: 5 });

      // 2. Mine it (set to AIR)
      engine.setBlock(5, 5, 5, BlockType.AIR);
      expect(engine.findMiningTargets(10).find((t) => t.x === 5 && t.y === 5 && t.z === 5)).toBeUndefined();

      // 3. Build a frame in its place
      engine.setBlock(5, 5, 5, BlockType.FRAME);
      expect(engine.findBlocksByType(BlockType.FRAME, 10)).toContainEqual({ x: 5, y: 5, z: 5 });

      // 4. Upgrade frame to panel
      engine.setBlock(5, 5, 5, BlockType.PANEL);
      expect(engine.findBlocksByType(BlockType.FRAME, 10).length).toBe(0);
      expect(engine.findBlocksByType(BlockType.PANEL, 10)).toContainEqual({ x: 5, y: 5, z: 5 });

      // 5. Upgrade panel to shell
      engine.setBlock(5, 5, 5, BlockType.SHELL);
      expect(engine.findBlocksByType(BlockType.PANEL, 10).length).toBe(0);
    });

    it('handles multiple scattered blocks correctly', () => {
      const positions = [
        { x: 1, y: 1, z: 1, type: BlockType.ASTEROID_SURFACE },
        { x: 10, y: 20, z: 30, type: BlockType.ASTEROID_CORE },
        { x: 100, y: 0, z: 50, type: BlockType.RARE_ORE },
        { x: -5, y: -5, z: -5, type: BlockType.FRAME },
        { x: 3, y: 3, z: 3, type: BlockType.PANEL },
        { x: 7, y: 7, z: 7, type: BlockType.ASTEROID_SURFACE },
      ] as const;

      for (const p of positions) {
        engine.setBlock(p.x, p.y, p.z, p.type);
      }

      const mines = engine.findMiningTargets(100);
      const frames = engine.findBlocksByType(BlockType.FRAME, 100);
      const panels = engine.findBlocksByType(BlockType.PANEL, 100);

      // The three mine-type blocks should be in mining targets (exposed to AIR)
      expect(mines).toContainEqual({ x: 1, y: 1, z: 1 });
      expect(mines).toContainEqual({ x: 10, y: 20, z: 30 });
      expect(mines).toContainEqual({ x: 100, y: 0, z: 50 });
      expect(mines).toContainEqual({ x: 7, y: 7, z: 7 });

      // The FRAME block should be in buildable frames
      expect(frames).toContainEqual({ x: -5, y: -5, z: -5 });

      // The PANEL block should be in buildable panels
      expect(panels).toContainEqual({ x: 3, y: 3, z: 3 });

      // SHELL and ASTEROID blocks should NOT appear as frames or panels
      expect(frames.length).toBe(1);
      expect(panels.length).toBe(1);
    });

    it('preserves index consistency after asteroid generation', () => {
      engine.generateAsteroid(2, 0, 2, 5);

      const targets = engine.findMiningTargets(100);
      expect(targets.length).toBeGreaterThan(0);

      // All targets should be valid mine type blocks
      for (const target of targets) {
        const block = engine.getBlock(target.x, target.y, target.z);
        expect([BlockType.ASTEROID_SURFACE, BlockType.ASTEROID_CORE, BlockType.RARE_ORE]).toContain(
          block,
        );
      }
    });
  });
});
