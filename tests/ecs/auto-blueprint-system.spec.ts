import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore } from '../../src/state/store';
import {
  AutoBlueprintSystem,
  resetAutoBlueprintSystemForTests,
} from '../../src/ecs/systems/AutoBlueprintSystem';
import { BlockType } from '../../src/types';
import { FRAME_COST } from '../../src/constants';
import * as THREE from 'three';
import { ECS } from '../../src/ecs/world';
import { ConstructionSystem } from '../../src/ecs/systems/ConstructionSystem';
import { createRuntimeContext, RuntimeContext } from '../../src/ecs/RuntimeContext';

describe('AutoBlueprintSystem', () => {
  let runtime: RuntimeContext;

  beforeEach(() => {
    ECS.clear();
    runtime = createRuntimeContext({ mesherWorkerCount: 0 });
    resetAutoBlueprintSystemForTests();
    useStore.setState({ autoBlueprintEnabled: false });
  });

  afterEach(() => {
    ECS.clear();
    runtime.mesherPool.dispose();
  });

  const getConstructionProps = (elapsedTime: number = 0) => {
    const store = useStore.getState();
    return {
      elapsedTime,
      asteroidOrbitEnabled: store.asteroidOrbitEnabled,
      asteroidOrbitRadius: store.asteroidOrbitRadius,
      asteroidOrbitSpeed: store.asteroidOrbitSpeed,
      asteroidOrbitVerticalAmplitude: store.asteroidOrbitVerticalAmplitude,
      consumeMatter: store.consumeMatter,
      consumeRareMatter: store.consumeRareMatter,
      consumeEnergy: store.consumeEnergy,
      setEnergyRate: store.setEnergyRate,
      setDysonProgress: store.setDysonProgress,
      runtime,
    };
  };

  it('should not add blueprints when auto mode is disabled', () => {
    useStore.setState({ autoBlueprintEnabled: false });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });
    expect(runtime.blueprints.getBlueprints()).toHaveLength(0);
  });

  it('should add at most one blueprint per interval when enabled', () => {
    useStore.setState({ autoBlueprintEnabled: true });

    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });
    expect(runtime.blueprints.getBlueprints()).toHaveLength(1);
    expect(useStore.getState().dysonProgress.blueprintFrames).toBe(1);

    // still within interval, no new addition
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0.5 });
    expect(runtime.blueprints.getBlueprints()).toHaveLength(1);

    // after interval passed
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 1.1 });
    expect(runtime.blueprints.getBlueprints()).toHaveLength(2);
  });

  it('should expand in deterministic sphere-aware order from origin', () => {
    useStore.setState({ autoBlueprintEnabled: true });

    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 1.1 });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 2.2 });

    const bps = runtime.blueprints.getBlueprints();
    // origin is closest (distSq=0)
    expect(bps).toContainEqual({ x: 0, y: 0, z: 0 });
    // unit-distance neighbours (distSq=1) follow; x,y,z tiebreak gives (-1,0,0) then (0,-1,0)
    expect(bps).toContainEqual({ x: -1, y: 0, z: 0 });
    expect(bps).toContainEqual({ x: 0, y: -1, z: 0 });
  });

  it('should include y-axis neighbours in sphere-aware expansion', () => {
    useStore.setState({ autoBlueprintEnabled: true });

    // Run 7 intervals to cover origin + all 6 unit-distance axis-aligned neighbours
    for (let i = 0; i < 7; i++) {
      AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: i * 1.1 });
    }

    const bps = runtime.blueprints.getBlueprints();
    // Both y-axis unit neighbours must be present, proving expansion is 3-dimensional
    expect(bps).toContainEqual({ x: 0, y: 1, z: 0 });
    expect(bps).toContainEqual({ x: 0, y: -1, z: 0 });
  });

  it('should skip non-AIR coordinates during auto expansion', () => {
    useStore.setState({ autoBlueprintEnabled: true });
    // mark first candidate occupied so algorithm will skip
    runtime.engine.setBlock(0, 0, 0, BlockType.FRAME);

    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });
    const bps = runtime.blueprints.getBlueprints();
    expect(bps).toHaveLength(1);
    expect(bps[0]).toEqual({ x: -1, y: 0, z: 0 });
  });

  it('resets traversal when auto mode is re-enabled', () => {
    useStore.setState({ autoBlueprintEnabled: true });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 1.1 });

    runtime.engine.setBlock(0, 0, 0, BlockType.AIR);
    runtime.blueprints.removeBlueprint({ x: 0, y: 0, z: 0 });

    useStore.setState({ autoBlueprintEnabled: false });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 2.2 });

    useStore.setState({ autoBlueprintEnabled: true });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });

    expect(runtime.blueprints.hasBlueprint({ x: 0, y: 0, z: 0 })).toBe(true);
  });

  it('resets traversal after world reset', () => {
    useStore.setState({ autoBlueprintEnabled: true });

    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 1.1 });
    expect(runtime.blueprints.getBlueprints()).toHaveLength(2);

    runtime.engine.resetWorld(runtime.blueprints);
    resetAutoBlueprintSystemForTests();
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });

    const bps = runtime.blueprints.getBlueprints();
    expect(bps).toEqual([{ x: 0, y: 0, z: 0 }]);
  });

  // integration: ensure blueprints placed by the auto system can be
  // consumed by the construction pipeline
  it('auto-generated blueprints are consumable by construction', () => {
    useStore.setState({
      autoBlueprintEnabled: true,
      matter: FRAME_COST,
      rareMatter: 0,
      energy: 1000,
      asteroidOrbitEnabled: false,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });

    // run auto system once to add a blueprint at 0,0,0
    AutoBlueprintSystem({ runtime, delta: 0, elapsedTime: 0 });
    const bps = runtime.blueprints.getBlueprints();
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

    ConstructionSystem(getConstructionProps(0));

    expect(runtime.engine.getBlock(target.x, target.y, target.z)).toBe(BlockType.FRAME);
    expect(runtime.blueprints.hasBlueprint(target)).toBe(false);
  });
});
