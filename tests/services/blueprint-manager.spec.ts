import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlueprintManager } from '../../src/services/BlueprintManager';

describe('BlueprintManager', () => {
  let manager: BlueprintManager;

  beforeEach(() => {
    // Reset singleton instance for testing if possible, or just clear it
    // Since it's a singleton, we might need a reset method or just manage state
    // For now we assume we can get the instance and it shares state, so we clear it manually if we could
    // But we don't have a clear method. Let's rely on adding unique blueprints.
    manager = BlueprintManager.getInstance();
    // A better pattern for testing singletons is to allow resetting or accessing internal state
    // But let's work with the public API
    
    // Hack ref to clear for test isolation
    (manager as any).blueprints.clear();
    (manager as any).listeners = [];
  });

  it('should add blueprints', () => {
    manager.addBlueprint({ x: 1, y: 2, z: 3 });
    expect(manager.hasBlueprint({ x: 1, y: 2, z: 3 })).toBe(true);
    expect(manager.getBlueprints()).toHaveLength(1);
  });

  it('should remove blueprints', () => {
    manager.addBlueprint({ x: 10, y: 10, z: 10 });
    expect(manager.hasBlueprint({ x: 10, y: 10, z: 10 })).toBe(true);

    manager.removeBlueprint({ x: 10, y: 10, z: 10 });
    expect(manager.hasBlueprint({ x: 10, y: 10, z: 10 })).toBe(false);
  });

  it('should notify listeners', () => {
    const listener = vi.fn();
    manager.subscribe(listener);

    manager.addBlueprint({ x: 5, y: 5, z: 5 });
    expect(listener).toHaveBeenCalledTimes(1);

    manager.removeBlueprint({ x: 5, y: 5, z: 5 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should handle duplicate adds gracefully', () => {
    const listener = vi.fn();
    manager.subscribe(listener);

    manager.addBlueprint({ x: 1, y: 1, z: 1 });
    manager.addBlueprint({ x: 1, y: 1, z: 1 }); // Duplicate

    expect(manager.getBlueprints()).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1); // Should only fire on actual change
  });
});
