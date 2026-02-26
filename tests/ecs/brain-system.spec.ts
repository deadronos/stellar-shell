import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';

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

import { BrainSystem } from '../../src/ecs/systems/BrainSystem';

describe('BrainSystem', () => {
  beforeEach(() => {
    ECS.clear();
    vi.clearAllMocks();

    useStore.setState({
      matter: 0,
      rareMatter: 0,
      energy: 0,
      droneCount: 1,
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
});
