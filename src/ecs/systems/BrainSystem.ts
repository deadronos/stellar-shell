import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType } from '../../types';
import { useStore } from '../../state/store';
import { FRAME_COST, SHELL_COST } from '../../constants';
import { BlueprintManager } from '../../services/BlueprintManager';
import { getAsteroidOrbitOffset } from '../../services/AsteroidOrbit';
import { computeDroneRoleAllocation, DRONE_ROLE_ORDER } from '../../utils/droneRoles';

const ENGINE = BvxEngine.getInstance();
const BLUEPRINT_MANAGER = BlueprintManager.getInstance();

// Query caches
let cachedMines: { x: number; y: number; z: number }[] | null = null;
let lastCacheTime = 0;

export const resetBrainSystemCaches = () => {
  cachedMines = null;
  lastCacheTime = 0;
};

const syncDroneRoleAssignments = () => {
  const { droneCount, manualDroneRoleTargets } = useStore.getState();
  const drones = [...ECS.with('isDrone', 'position', 'velocity').entities].sort(
    (left, right) => (left.id ?? 0) - (right.id ?? 0),
  );
  const allocation = computeDroneRoleAllocation(droneCount, manualDroneRoleTargets);

  let cursor = 0;
  for (const role of DRONE_ROLE_ORDER) {
    const targetCount = allocation.effective[role];
    for (let index = 0; index < targetCount && cursor < drones.length; index += 1) {
      drones[cursor].roleAssignment = role;
      cursor += 1;
    }
  }

  while (cursor < drones.length) {
    drones[cursor].roleAssignment = 'MINER';
    cursor += 1;
  }
};

export const BrainSystem = (clock: THREE.Clock) => {
  syncDroneRoleAssignments();

  const state = useStore.getState();
  const currentMatter = state.matter;
  const droneCount = state.droneCount;
  const orbitOffset = getAsteroidOrbitOffset(clock.elapsedTime, {
    enabled: state.asteroidOrbitEnabled,
    radius: state.asteroidOrbitRadius,
    speed: state.asteroidOrbitSpeed,
    verticalAmplitude: state.asteroidOrbitVerticalAmplitude,
  });

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
    if (drone.state !== 'IDLE' && drone.state !== 'EXPLORING') continue;
    const roleAssignment = drone.roleAssignment ?? 'MINER';

    // SELF-HEALING: Clear stale components if IDLE or EXPLORING.
    // An IDLE/EXPLORING drone should have no targetBlock and no carryingType
    // (though it may have a 'target' orbit position set during idle patrol).
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

        const tx = item.x + orbitOffset.x;
        const ty = item.y + orbitOffset.y;
        const tz = item.z + orbitOffset.z;
        const dx = tx - drone.position.x;
        const dy = ty - drone.position.y;
        const dz = tz - drone.position.z;
        const dSq = dx * dx + dy * dy + dz * dz;

        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestTarget = item;
          targetType = type;
        }
      }
    };

    if (roleAssignment === 'BUILDER') {
      // Priority: BUILD (Blueprints) > UPGRADE (Frames -> Energy)
      if (canBuild && blueprints.length > 0) {
        findClosest(blueprints, 'BUILD');
      }

      if (!bestTarget && canBuild && state.energy < 1000) {
        const frames = ENGINE.findBlocksByType(BlockType.FRAME, 5);
        if (frames.length > 0) {
          findClosest(frames, 'BUILD');
        }
      }

      const canUpgradeToShell = state.rareMatter >= SHELL_COST;
      if (!bestTarget && canUpgradeToShell) {
        const panels = ENGINE.findBlocksByType(BlockType.PANEL, 5);
        if (panels.length > 0) {
          findClosest(panels, 'BUILD');
        }
      }
    }

    if (roleAssignment === 'MINER' && !bestTarget) {
      const mines = getMines();
      if (Math.random() < 0.01) {
        console.log(
          `[Brain] Drone ${drone.id} searching. Mines Found: ${mines?.length}. Blueprints: ${blueprints.length}. Reserved: ${reservedBlocks.size}`,
        );
      }
      findClosest(mines, 'MINE');
    }

    if (bestTarget && targetType) {
      const t = bestTarget as { x: number; y: number; z: number };

      ECS.addComponent(
        drone,
        'target',
        new THREE.Vector3(t.x + orbitOffset.x, t.y + orbitOffset.y, t.z + orbitOffset.z),
      );
      ECS.addComponent(drone, 'targetBlock', t);

      drone.state = targetType === 'BUILD' ? 'MOVING_TO_BUILD' : 'MOVING_TO_MINE';
      drone.carryingType = targetType === 'BUILD' ? BlockType.FRAME : null;

      reservedBlocks.add(`${t.x},${t.y},${t.z}`);
    } else {
      // Dynamic idle patrol around the current asteroid center for coordinate consistency.
      const fallbackSpeed =
        state.asteroidOrbitEnabled && state.asteroidOrbitSpeed !== 0
          ? state.asteroidOrbitSpeed
          : 0.1;
      const time = clock.elapsedTime * fallbackSpeed + (drone.id || Math.random() * 100) * 0.137;
      const baseRadius = state.asteroidOrbitEnabled ? Math.max(8, state.asteroidOrbitRadius * 0.35) : 30;
      const radius = baseRadius + Math.sin(time * 2.0) * 5;
      const heightAmplitude = state.asteroidOrbitEnabled
        ? Math.max(3, state.asteroidOrbitVerticalAmplitude * 4)
        : 15;
      const height = Math.sin(time * 0.5) * heightAmplitude;

      const centerX = state.asteroidOrbitEnabled ? orbitOffset.x : 0;
      const centerY = state.asteroidOrbitEnabled ? orbitOffset.y : 0;
      const centerZ = state.asteroidOrbitEnabled ? orbitOffset.z : 0;
      const orbitPos = new THREE.Vector3(
        centerX + Math.cos(time) * radius,
        centerY + height,
        centerZ + Math.sin(time) * radius,
      );

      ECS.addComponent(drone, 'target', orbitPos);
      drone.state = roleAssignment === 'EXPLORER' ? 'EXPLORING' : 'IDLE';
    }
  }
};
