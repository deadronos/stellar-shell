import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType, Vector3 } from '../../types';
import { useStore } from '../../state/store'; 
import { FRAME_COST, SHELL_COST } from '../../constants';
import { BlueprintManager } from '../../services/BlueprintManager';

const ENGINE = BvxEngine.getInstance();
const BLUEPRINT_MANAGER = BlueprintManager.getInstance();

// Query caches
let cachedMines: { x: number; y: number; z: number }[] | null = null;
let lastCacheTime = 0;

export const BrainSystem = (clock: THREE.Clock) => {
  const state = useStore.getState();
  const currentMatter = state.matter;
  const droneCount = state.droneCount;

  // Refresh caches periodically (e.g. every 0.5s)
  if (clock.elapsedTime - lastCacheTime > 0.5) {
      cachedMines = null;
      lastCacheTime = clock.elapsedTime;
  }

  const getMines = () => {
    if (!cachedMines) cachedMines = ENGINE.findMiningTargets(droneCount + 20);
    return cachedMines;
  };
  
  // Get active blueprints directly from manager - efficient enough for now
  const getBlueprints = () => BLUEPRINT_MANAGER.getBlueprints();

  /* 
     Fix: Previously we used .without('target'), but IDLE drones have orbit targets.
     We should query all drones and check state 'IDLE'.
  */
  const allDrones = ECS.with('isDrone', 'position', 'velocity');
  const targetBlockDrones = ECS.with('targetBlock');

  // Build reserved set from ECS
  const reservedBlocks = new Set<string>();
  for (const d of targetBlockDrones) {
    if (d.targetBlock) {
      reservedBlocks.add(`${d.targetBlock.x},${d.targetBlock.y},${d.targetBlock.z}`);
    }
  }

  for (const drone of allDrones) {
    if (drone.state !== 'IDLE') continue;

    // SELF-HEALING: Clear stale components if IDLE
    // If a drone is IDLE, it shouldn't have a targetBlock or carryingType
    if (drone.targetBlock || drone.carryingType) {
        console.warn(`[Brain] Drone ${drone.id} is IDLE but has stale components. Cleaning up.`);
        ECS.removeComponent(drone, 'targetBlock');
        drone.carryingType = null;
    }


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

    // Priority: BUILD (Blueprints) > UPGRADE (Frames -> Energy) > MINE
    if (canBuild && blueprints.length > 0) {
        findClosest(blueprints, 'BUILD');
    }

    // Secondary Priority: Upgrade Frames -> Panels if Energy is needed
    if (!bestTarget && canBuild && state.energy < 1000) {
         const frames = ENGINE.findBlocksByType(BlockType.FRAME, 5); 
         if (frames.length > 0) {
             findClosest(frames, 'BUILD');
         }
    }

    // Tertiary Priority: Upgrade Panels -> Shells (Highest Value) if Rare Matter available
    const canUpgradeToShell = state.rareMatter >= SHELL_COST;
    if (!bestTarget && canUpgradeToShell) {
        // Find panels to upgrade
        const panels = ENGINE.findBlocksByType(BlockType.PANEL, 5);
        if (panels.length > 0) {
            findClosest(panels, 'BUILD'); // Reuse BUILD mode
        }
    }
    
    // If no build target found (or cannot build), look for mine
    if (!bestTarget) {
        const mines = getMines();
        if (Math.random() < 0.01) {
            console.log(`[Brain] Drone ${drone.id} searching. Mines Found: ${mines?.length}. Blueprints: ${blueprints.length}. Reserved: ${reservedBlocks.size}`);
        }
        findClosest(mines, 'MINE');
    }

    if (bestTarget && targetType) {
      const t = bestTarget as { x: number; y: number; z: number };
      
      ECS.addComponent(drone, 'target', new THREE.Vector3(t.x, t.y, t.z));
      ECS.addComponent(drone, 'targetBlock', t);
      ECS.addComponent(drone, 'targetBlock', t);

      drone.state = targetType === 'BUILD' ? 'MOVING_TO_BUILD' : 'MOVING_TO_MINE';
      drone.carryingType = targetType === 'BUILD' ? BlockType.FRAME : null;

      reservedBlocks.add(`${t.x},${t.y},${t.z}`);
    } else {
      // Dynamic Orbit - Only for IDLE drones
      const time = clock.elapsedTime * 0.1 + (drone.id || Math.random() * 100) * 0.137;
      const radius = 30 + Math.sin(time * 2.0) * 5;
      const height = Math.sin(time * 0.5) * 15;

      // Orbit around Star (0,0,0) generally
      const orbitPos = new THREE.Vector3(
        Math.cos(time) * radius,
        height,
        Math.sin(time) * radius,
      );

      // Directly update target if already present (to avoid thrashing component add/remove if avoidable, though Miniplex handles add effectively as update)
      // ECS.addComponent will update the value if it exists.
      ECS.addComponent(drone, 'target', orbitPos);
    }
  }
};
