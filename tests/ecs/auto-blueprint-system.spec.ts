import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/state/store';
import { AutoBlueprintSystem, resetAutoBlueprintSystemForTests } from '../../src/ecs/systems/AutoBlueprintSystem';
import { BlueprintManager } from '../../src/services/BlueprintManager';
import { BvxEngine } from '../../src/services/BvxEngine';
import { BlockType } from '../../src/types';
import { FRAME_COST } from '../../src/constants';
import * as THREE from 'three';
import { ECS } from '../../src/ecs/world';
import { ConstructionSystem } from '../../src/ecs/systems/ConstructionSystem';

// simple helper to reset engine world for tests
const resetEngine = () => {
  const engine = BvxEngine.getInstance();
  engine.resetWorld();
};

describe('AutoBlueprintSystem', () => {
  beforeEach(() => {
    BlueprintManager.getInstance().resetForTests();
    resetAutoBlueprintSystemForTests();
    useStore.setState({ autoBlueprintEnabled: false });
    resetEngine();
  });

  it('should not add blueprints when auto mode is disabled', () => {
    useStore.setState({ autoBlueprintEnabled: false });
    AutoBlueprintSystem(0, 0);
    expect(BlueprintManager.getInstance().getBlueprints()).toHaveLength(0);
  });

  it('should add at most one blueprint per interval when enabled', () => {
    useStore.setState({ autoBlueprintEnabled: true });
    resetEngine();

    AutoBlueprintSystem(0, 0);
    expect(BlueprintManager.getInstance().getBlueprints()).toHaveLength(1);
    expect(useStore.getState().dysonProgress.blueprintFrames).toBe(1);

    // still within interval, no new addition
    AutoBlueprintSystem(0, 0.5);
    expect(BlueprintManager.getInstance().getBlueprints()).toHaveLength(1);

    // after interval passed
    AutoBlueprintSystem(0, 1.1);
    expect(BlueprintManager.getInstance().getBlueprints()).toHaveLength(2);
  });

  it('should expand in deterministic sphere-aware order from origin', () => {
    useStore.setState({ autoBlueprintEnabled: true });
    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    AutoBlueprintSystem(0, 0);
    AutoBlueprintSystem(0, 1.1);
    AutoBlueprintSystem(0, 2.2);

    const bps = BlueprintManager.getInstance().getBlueprints();
    // origin is closest (distSq=0)
    expect(bps).toContainEqual({ x: 0, y: 0, z: 0 });
    // unit-distance neighbours (distSq=1) follow; x,y,z tiebreak gives (-1,0,0) then (0,-1,0)
    expect(bps).toContainEqual({ x: -1, y: 0, z: 0 });
    expect(bps).toContainEqual({ x: 0, y: -1, z: 0 });
  });

  it('should include y-axis neighbours in sphere-aware expansion', () => {
    useStore.setState({ autoBlueprintEnabled: true });
    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    // Run 7 intervals to cover origin + all 6 unit-distance axis-aligned neighbours
    for (let i = 0; i < 7; i++) {
      AutoBlueprintSystem(0, i * 1.1);
    }

    const bps = BlueprintManager.getInstance().getBlueprints();
    // Both y-axis unit neighbours must be present, proving expansion is 3-dimensional
    expect(bps).toContainEqual({ x: 0, y: 1, z: 0 });
    expect(bps).toContainEqual({ x: 0, y: -1, z: 0 });
  });

  it('should skip non-AIR coordinates during auto expansion', () => {
    useStore.setState({ autoBlueprintEnabled: true });
    const engine = BvxEngine.getInstance();
    engine.resetWorld();
    // mark first candidate occupied so algorithm will skip
    engine.setBlock(0, 0, 0, BlockType.FRAME);

    AutoBlueprintSystem(0, 0);
    const bps = BlueprintManager.getInstance().getBlueprints();
    expect(bps).toHaveLength(1);
    expect(bps[0]).toEqual({ x: -1, y: 0, z: 0 });
  });

  it('resets traversal when auto mode is re-enabled', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    useStore.setState({ autoBlueprintEnabled: true });
    AutoBlueprintSystem(0, 0);
    AutoBlueprintSystem(0, 1.1);

    engine.setBlock(0, 0, 0, BlockType.AIR);
    BlueprintManager.getInstance().removeBlueprint({ x: 0, y: 0, z: 0 });

    useStore.setState({ autoBlueprintEnabled: false });
    AutoBlueprintSystem(0, 2.2);

    useStore.setState({ autoBlueprintEnabled: true });
    AutoBlueprintSystem(0, 0);

    expect(BlueprintManager.getInstance().hasBlueprint({ x: 0, y: 0, z: 0 })).toBe(true);
  });

  it('resets traversal after world reset', () => {
    const engine = BvxEngine.getInstance();
    useStore.setState({ autoBlueprintEnabled: true });

    AutoBlueprintSystem(0, 0);
    AutoBlueprintSystem(0, 1.1);
    expect(BlueprintManager.getInstance().getBlueprints()).toHaveLength(2);

    engine.resetWorld();
    AutoBlueprintSystem(0, 0);

    const bps = BlueprintManager.getInstance().getBlueprints();
    expect(bps).toEqual([{ x: 0, y: 0, z: 0 }]);
  });

  // integration: ensure blueprints placed by the auto system can be
  // consumed by the construction pipeline
  it('auto-generated blueprints are consumable by construction', () => {
    useStore.setState({
      autoBlueprintEnabled: true,
      matter: FRAME_COST,
      rareMatter: 0,
      asteroidOrbitEnabled: false,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });

    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    // run auto system once to add a blueprint at 0,0,0
    AutoBlueprintSystem(0, 0);
    const bps = BlueprintManager.getInstance().getBlueprints();
    expect(bps).toHaveLength(1);
    const target = bps[0];

    // spawn a drone directly on the blueprint and invoke construction
    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(target.x, target.y, target.z),
      target: new THREE.Vector3(target.x, target.y, target.z),
      targetBlock: target,
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_BUILD',
      carryingType: BlockType.FRAME,
      miningProgress: 0,
    });

    ConstructionSystem(1 / 60, 0);

    expect(engine.getBlock(target.x, target.y, target.z)).toBe(BlockType.FRAME);
    expect(BlueprintManager.getInstance().hasBlueprint(target)).toBe(false);
  });
});
