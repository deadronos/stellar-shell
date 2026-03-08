import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';
import { createEmptyDroneRoleTargets } from '../../src/utils/droneRoles';

const { mockEngine, mockBlueprintManager } = vi.hoisted(() => ({
  mockEngine: {
    findMiningTargets: vi.fn(),
    findBlocksByType: vi.fn(),
  },
  mockBlueprintManager: {
    getBlueprints: vi.fn(),
  },
}));

vi.mock('../../src/services/BvxEngine', () => ({
  BvxEngine: {
    getInstance: () => mockEngine,
  },
}));

vi.mock('../../src/services/BlueprintManager', () => ({
  BlueprintManager: {
    getInstance: () => mockBlueprintManager,
  },
}));

import { BrainSystem, resetBrainSystemCaches } from '../../src/ecs/systems/BrainSystem';

describe('BrainSystem', () => {
  beforeEach(() => {
    ECS.clear();
    vi.clearAllMocks();
    resetBrainSystemCaches();

    useStore.setState({
      matter: 0,
      rareMatter: 0,
      energy: 0,
      droneCount: 1,
      manualDroneRoleTargets: createEmptyDroneRoleTargets(),
      asteroidOrbitEnabled: false,
      asteroidOrbitRadius: 24,
      asteroidOrbitSpeed: 0.08,
      asteroidOrbitVerticalAmplitude: 2,
    });

    mockBlueprintManager.getBlueprints.mockReturnValue([]);
    mockEngine.findBlocksByType.mockReturnValue([]);
    mockEngine.findMiningTargets.mockReturnValue([]);
  });

  it('assigns orbit-adjusted world targets for mining', () => {
    useStore.setState({
      asteroidOrbitEnabled: true,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
      manualDroneRoleTargets: { MINER: 1, BUILDER: 0, EXPLORER: 0 },
    });

    mockEngine.findMiningTargets.mockReturnValue([{ x: 0, y: 0, z: 0 }]);

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(10, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carryingType: null,
    });

    BrainSystem({ elapsedTime: 0 } as THREE.Clock);

    expect(drone.state).toBe('MOVING_TO_MINE');
    expect(drone.targetBlock).toEqual({ x: 0, y: 0, z: 0 });
    expect(drone.target.x).toBeCloseTo(10, 5);
    expect(drone.target.y).toBeCloseTo(0, 5);
    expect(drone.target.z).toBeCloseTo(0, 5);
  });

  it('keeps idle patrol centered around the moving asteroid when orbit is enabled', () => {
    useStore.setState({
      asteroidOrbitEnabled: true,
      asteroidOrbitRadius: 12,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
      manualDroneRoleTargets: { MINER: 1, BUILDER: 0, EXPLORER: 0 },
    });

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carryingType: null,
    });

    BrainSystem({ elapsedTime: 0 } as THREE.Clock);

    const target = drone.target as THREE.Vector3;
    const center = new THREE.Vector3(12, 0, 0);
    const distanceToCenter = Math.hypot(target.x - center.x, target.z - center.z);

    expect(distanceToCenter).toBeLessThan(15);
  });

  it('routes builder-role drones to build tasks', () => {
    useStore.setState({
      matter: 100,
      manualDroneRoleTargets: { MINER: 0, BUILDER: 1, EXPLORER: 0 },
    });

    mockBlueprintManager.getBlueprints.mockReturnValue([{ x: 3, y: 2, z: 1 }]);
    mockEngine.findMiningTargets.mockReturnValue([{ x: 0, y: 0, z: 0 }]);

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carryingType: null,
    });

    BrainSystem({ elapsedTime: 1 } as THREE.Clock);

    expect(drone.roleAssignment).toBe('BUILDER');
    expect(drone.state).toBe('MOVING_TO_BUILD');
    expect(drone.targetBlock).toEqual({ x: 3, y: 2, z: 1 });
  });

  it('routes miner-role drones to mining tasks even when build work exists', () => {
    useStore.setState({
      matter: 100,
      manualDroneRoleTargets: { MINER: 1, BUILDER: 0, EXPLORER: 0 },
    });

    mockBlueprintManager.getBlueprints.mockReturnValue([{ x: 3, y: 2, z: 1 }]);
    mockEngine.findMiningTargets.mockReturnValue([{ x: 9, y: 8, z: 7 }]);

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carryingType: null,
    });

    BrainSystem({ elapsedTime: 1 } as THREE.Clock);

    expect(drone.roleAssignment).toBe('MINER');
    expect(drone.state).toBe('MOVING_TO_MINE');
    expect(drone.targetBlock).toEqual({ x: 9, y: 8, z: 7 });
  });

  it('keeps explorer-role drones in the exploration loop instead of assigning work tasks', () => {
    useStore.setState({
      matter: 100,
      manualDroneRoleTargets: { MINER: 0, BUILDER: 0, EXPLORER: 1 },
    });

    mockBlueprintManager.getBlueprints.mockReturnValue([{ x: 3, y: 2, z: 1 }]);
    mockEngine.findMiningTargets.mockReturnValue([{ x: 9, y: 8, z: 7 }]);

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carryingType: null,
    });

    BrainSystem({ elapsedTime: 1 } as THREE.Clock);

    expect(drone.roleAssignment).toBe('EXPLORER');
    expect(drone.state).toBe('EXPLORING');
    expect(drone.targetBlock).toBeUndefined();
  });

  it('keeps non-explorer drones idle when no matching role work exists', () => {
    useStore.setState({
      manualDroneRoleTargets: { MINER: 1, BUILDER: 0, EXPLORER: 0 },
    });

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carryingType: null,
    });

    BrainSystem({ elapsedTime: 1 } as THREE.Clock);

    expect(drone.roleAssignment).toBe('MINER');
    expect(drone.state).toBe('IDLE');
    expect(drone.target).toBeInstanceOf(THREE.Vector3);
    expect(drone.targetBlock).toBeUndefined();
  });
});
