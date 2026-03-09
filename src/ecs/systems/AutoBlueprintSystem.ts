import { BlockType } from '../../types';
import { useStore } from '../../state/store';
import { BlueprintManager } from '../../services/BlueprintManager';
import { BvxEngine } from '../../services/BvxEngine';

// how often we generate a new blueprint (seconds)
const AUTO_INTERVAL = 1.0;
const AUTO_RADIUS = 48;

// start sufficiently in the past so the first call will succeed
let lastAddTime = -AUTO_INTERVAL;
let nextCandidateIndex = 0;
let wasEnabled = false;

interface Candidate {
  x: number;
  y: number;
  z: number;
  distSq: number;
}

const buildCandidates = (radius: number): ReadonlyArray<{ x: number; y: number; z: number }> => {
  const candidates: Candidate[] = [];
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= radius; z++) {
        const distSq = x * x + y * y + z * z;
        if (distSq > radius * radius) continue;
        candidates.push({ x, y, z, distSq });
      }
    }
  }

  candidates.sort((a, b) => a.distSq - b.distSq || a.x - b.x || a.y - b.y || a.z - b.z);
  return candidates.map(({ x, y, z }) => ({ x, y, z }));
};

const AUTO_CANDIDATES = buildCandidates(AUTO_RADIUS);

/**
 * Reset traversal/timing state so runtime world resets and tests both restart from
 * the beginning of the deterministic outward scan.
 */
export function resetAutoBlueprintTraversal() {
  lastAddTime = -AUTO_INTERVAL;
  nextCandidateIndex = 0;
  wasEnabled = false;
}

export const resetAutoBlueprintSystemForTests = resetAutoBlueprintTraversal;

export const AutoBlueprintSystem = (_delta: number, elapsedTime: number = 0) => {
  const state = useStore.getState();
  if (!state.autoBlueprintEnabled) {
    wasEnabled = false;
    return;
  }

  if (!wasEnabled) {
    lastAddTime = -AUTO_INTERVAL;
    nextCandidateIndex = 0;
    wasEnabled = true;
  }

  // throttle generation; lastAddTime is initialized negative so the very first
  // call will pass regardless of elapsedTime.
  if (elapsedTime - lastAddTime < AUTO_INTERVAL) return;

  const engine = BvxEngine.getInstance();
  const manager = BlueprintManager.getInstance();

  // Deterministic 3D radius-sorted scan around origin – sphere-aware expansion.
  // Candidates are ordered from closest to farthest from the star at (0,0,0),
  // covering the full sphere volume across all axes.
  // Skip any coordinates that are not AIR; only one blueprint per invocation.
  let attempts = 0;
  while (attempts < AUTO_CANDIDATES.length) {
    const coord = AUTO_CANDIDATES[nextCandidateIndex];
    nextCandidateIndex = (nextCandidateIndex + 1) % AUTO_CANDIDATES.length;
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
