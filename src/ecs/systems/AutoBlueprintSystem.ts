import { BlockType } from '../../types';
import { useStore } from '../../state/store';
import { BlueprintManager } from '../../services/BlueprintManager';
import { BvxEngine } from '../../services/BvxEngine';

// how often we generate a new blueprint (seconds)
const AUTO_INTERVAL = 1.0;

// start sufficiently in the past so the first call will succeed
let lastAddTime = -AUTO_INTERVAL;
let nextCandidateX = 0;

/**
 * Reset internal state; only used by tests so they get deterministic behavior.
 */
export function resetAutoBlueprintSystemForTests() {
  lastAddTime = -AUTO_INTERVAL;
  nextCandidateX = 0;
}

export const AutoBlueprintSystem = (_delta: number, elapsedTime: number = 0) => {
  const state = useStore.getState();
  if (!state.autoBlueprintEnabled) return;

  // throttle generation; lastAddTime is initialized negative so the very first
  // call will pass regardless of elapsedTime.
  if (elapsedTime - lastAddTime < AUTO_INTERVAL) return;

  const engine = BvxEngine.getInstance();
  const manager = BlueprintManager.getInstance();

  // Generate a candidate position sequence along +X axis for now.
  // Skip any coordinates that are not air; only one blueprint per invocation.
  let attempts = 0;
  while (attempts < 100) {
    const coord = { x: nextCandidateX++, y: 0, z: 0 };
    const block = engine.getBlock(coord.x, coord.y, coord.z);
    if (block === BlockType.AIR) {
      engine.setBlock(coord.x, coord.y, coord.z, BlockType.BLUEPRINT_FRAME);
      manager.addBlueprint(coord);
      state.setDysonProgress(engine.computeDysonProgress());
      lastAddTime = elapsedTime;
      break;
    }
    attempts++;
  }
};
