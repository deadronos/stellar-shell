import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/state/store';
import { AutoBlueprintSystem, resetAutoBlueprintSystemForTests } from '../../src/ecs/systems/AutoBlueprintSystem';
import { BlueprintManager } from '../../src/services/BlueprintManager';
import { BvxEngine } from '../../src/services/BvxEngine';
import { BlockType } from '../../src/types';

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

    // still within interval, no new addition
    AutoBlueprintSystem(0, 0.5);
    expect(BlueprintManager.getInstance().getBlueprints()).toHaveLength(1);

    // after interval passed
    AutoBlueprintSystem(0, 1.1);
    expect(BlueprintManager.getInstance().getBlueprints()).toHaveLength(2);
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
    expect(bps[0]).toEqual({ x: 1, y: 0, z: 0 });
  });
});
