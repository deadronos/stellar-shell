import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType } from '../../types';
import { useStore } from '../../state/store'; // Access store directly or pass state? Direct access is common in systems if store is singleton.
import { FRAME_COST } from '../../constants';

const ENGINE = BvxEngine.getInstance();

// Query caches
let cachedBlueprints: { x: number; y: number; z: number }[] | null = null;
let cachedMines: { x: number; y: number; z: number }[] | null = null;
let lastCacheTime = 0;

export const BrainSystem = (clock: THREE.Clock) => {
  const state = useStore.getState();
  const currentMatter = state.matter;
  const droneCount = state.droneCount;

  // Refresh caches periodically (e.g. every 0.1s or per frame if efficient)
  // For now, let's refresh every frame for simplicity, but we can throttle
  if (clock.elapsedTime - lastCacheTime > 0.5) {
      cachedBlueprints = null;
      cachedMines = null;
      lastCacheTime = clock.elapsedTime;
  }

  const getBlueprints = () => {
    if (!cachedBlueprints) cachedBlueprints = ENGINE.findBlueprints();
    return cachedBlueprints;
  };
  const getMines = () => {
    if (!cachedMines) cachedMines = ENGINE.findMiningTargets(droneCount + 20);
    return cachedMines;
  };

  const idleDrones = ECS.with('isDrone', 'position', 'velocity').without('target');
  const targetBlockDrones = ECS.with('targetBlock');

  // Build reserved set from ECS
  const reservedBlocks = new Set<string>();
  for (const d of targetBlockDrones) {
    if (d.targetBlock) {
      reservedBlocks.add(`${d.targetBlock.x},${d.targetBlock.y},${d.targetBlock.z}`);
    }
  }

  for (const drone of idleDrones) {
    const blueprints = getBlueprints();
    const canBuild = currentMatter >= FRAME_COST;

    let bestTarget: { x: number; y: number; z: number } | null = null;
    let minDistSq = Infinity;
    let targetType: 'BUILD' | 'MINE' | null = null;

    const findClosest = (list: { x: number; y: number; z: number }[], type: 'BUILD' | 'MINE') => {
      for (const item of list) {
        const key = `${item.x},${item.y},${item.z}`;
        if (reservedBlocks.has(key)) continue;

        const dx = item.x - drone.position.x;
        const dy = item.y - drone.position.y;
        const dz = item.z - drone.position.z;
        const dSq = dx * dx + dy * dy + dz * dz;

        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestTarget = item;
          targetType = type;
        }
      }
    };

    if (canBuild) findClosest(blueprints, 'BUILD');
    if (!bestTarget) findClosest(getMines(), 'MINE');

    if (bestTarget && targetType) {
      const t = bestTarget as { x: number; y: number; z: number };
      
      ECS.addComponent(drone, 'target', new THREE.Vector3(t.x, t.y, t.z));
      ECS.addComponent(drone, 'targetBlock', t);

      drone.state = targetType === 'BUILD' ? 'MOVING_TO_BUILD' : 'MOVING_TO_MINE';
      drone.carryingType = targetType === 'BUILD' ? BlockType.FRAME : null;

      reservedBlocks.add(`${t.x},${t.y},${t.z}`);
    } else {
      // Dynamic Orbit
      const time = clock.elapsedTime * 0.1 + (drone.id || Math.random() * 100) * 0.137;
      const radius = 30 + Math.sin(time * 2.0) * 5;
      const height = Math.sin(time * 0.5) * 15;

      const orbitPos = new THREE.Vector3(
        Math.cos(time) * radius,
        height,
        Math.sin(time) * radius,
      );

      ECS.addComponent(drone, 'target', orbitPos);
    }
  }
};
