import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { MiningSystem } from '../../src/ecs/systems/MiningSystem';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';
import { BvxEngine } from '../../src/services/BvxEngine';
import { createTestUpgrades } from '../helpers/upgrades';

describe('MiningSystem', () => {
  beforeEach(() => {
    ECS.clear();
    useStore.setState({ matter: 0, rareMatter: 0 });
    vi.spyOn(Math, 'random').mockReturnValue(1);
  });

  afterEach(() => {
    ECS.clear();
    vi.restoreAllMocks();
  });

  it('should process returning drones even if they do not have a targetBlock', () => {
    // Setup a drone that is returning resources
    // It is close to the hub (0,0,0) so it should deposit immediately
    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(1, 0, 0), // Close to 0,0,0
      target: new THREE.Vector3(0, 0, 0),
      state: 'RETURNING_RESOURCE',
      carryingType: BlockType.ASTEROID_SURFACE,
      miningProgress: 0,
    });

    // Verify initial state
    expect(drone.state).toBe('RETURNING_RESOURCE');
    expect(useStore.getState().matter).toBe(0);

    // Run the system
    MiningSystem(1/60);

    // SUCCESS EXPECTATION:
    // With the fix, the returningDrones query catches this drone,
    // so it should deposit matter and go to IDLE.
    expect(drone.state).toBe('IDLE');
    expect(useStore.getState().matter).toBe(1);
  });

  it('mines correctly when asteroid orbit motion is enabled', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();
    engine.setBlock(0, 0, 0, BlockType.ASTEROID_SURFACE);

    useStore.setState({
      prestigeLevel: 0,
      asteroidOrbitEnabled: true,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(10, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      targetBlock: { x: 0, y: 0, z: 0 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_MINE',
      carryingType: null,
      miningProgress: 99,
    });

    MiningSystem(0.1, 0);

    expect(drone.state).toBe('RETURNING_RESOURCE');
    expect(drone.carryingType).toBe(BlockType.ASTEROID_SURFACE);
    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.AIR);
  });

  it('drone mining rare ore deposits rare matter on return', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();
    engine.setBlock(0, 0, 0, BlockType.RARE_ORE);

    useStore.setState({ matter: 0, rareMatter: 0, prestigeLevel: 0, asteroidOrbitEnabled: false });

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(1, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      state: 'RETURNING_RESOURCE',
      carryingType: BlockType.RARE_ORE,
      miningProgress: 0,
    });

    MiningSystem(1 / 60);

    expect(drone.state).toBe('IDLE');
    expect(useStore.getState().rareMatter).toBe(1);
    expect(useStore.getState().matter).toBe(0);
  });

  it('drone can mine a rare ore block and transitions to RETURNING_RESOURCE', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();
    engine.setBlock(0, 0, 0, BlockType.RARE_ORE);

    useStore.setState({ matter: 0, rareMatter: 0, prestigeLevel: 0, asteroidOrbitEnabled: false });

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(1, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      targetBlock: { x: 0, y: 0, z: 0 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_MINE',
      carryingType: null,
      miningProgress: 99,
    });

    MiningSystem(0.1, 0);

    expect(drone.state).toBe('RETURNING_RESOURCE');
    expect(drone.carryingType).toBe(BlockType.RARE_ORE);
    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.AIR);
  });

  it('applies MINING_SPEED_1 to increase mining progress rate', () => {
    const engine = BvxEngine.getInstance();

    const runWithDrillUpgrade = (enabled: boolean) => {
      ECS.clear();
      engine.resetWorld();
      engine.setBlock(0, 0, 0, BlockType.ASTEROID_SURFACE);

      useStore.setState({
        prestigeLevel: 0,
        asteroidOrbitEnabled: false,
        upgrades: createTestUpgrades({ MINING_SPEED_1: enabled }),
      });

      const drone = ECS.add({
        isDrone: true,
        position: new THREE.Vector3(0.5, 0, 0),
        target: new THREE.Vector3(0, 0, 0),
        targetBlock: { x: 0, y: 0, z: 0 },
        velocity: new THREE.Vector3(0, 0, 0),
        state: 'MOVING_TO_MINE',
        carryingType: null,
        miningProgress: 0,
      });

      MiningSystem(1, 0);
      return drone.miningProgress;
    };

    const baseProgress = runWithDrillUpgrade(false);
    const boostedProgress = runWithDrillUpgrade(true);

    expect(baseProgress).toBeCloseTo(50, 5);
    expect(boostedProgress).toBeGreaterThan(baseProgress);
    expect(boostedProgress).toBeCloseTo(75, 5);
  });
});
