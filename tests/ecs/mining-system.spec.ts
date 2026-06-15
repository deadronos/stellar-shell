import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { MiningSystem } from '../../src/ecs/systems/MiningSystem';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';
import { createRuntimeContext, RuntimeContext } from '../../src/ecs/RuntimeContext';

describe('MiningSystem', () => {
  let runtime: RuntimeContext;

  beforeEach(() => {
    ECS.clear();
    runtime = createRuntimeContext({ mesherWorkerCount: 0 });
    useStore.setState({
      matter: 0,
      rareMatter: 0,
      energy: 1000,
      asteroidOrbitEnabled: true,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
      prestigeLevel: 0,
      upgrades: {
        MINING_SPEED_1: false,
        DRONE_SPEED_1: false,
        LASER_EFFICIENCY_1: false,
        AUTO_REPLICATOR: false,
        DEEP_SCAN_1: false,
        ADVANCED_EXPLORER: false,
      },
    });
  });

  afterEach(() => {
    ECS.clear();
    runtime.mesherPool.dispose();
  });

  const getSystemProps = (delta: number = 0.1, elapsedTime: number = 0) => {
    const store = useStore.getState();
    return {
      delta,
      elapsedTime,
      asteroidOrbitEnabled: store.asteroidOrbitEnabled,
      asteroidOrbitRadius: store.asteroidOrbitRadius,
      asteroidOrbitSpeed: store.asteroidOrbitSpeed,
      asteroidOrbitVerticalAmplitude: store.asteroidOrbitVerticalAmplitude,
      prestigeLevel: store.prestigeLevel,
      upgrades: store.upgrades,
      consumeEnergy: store.consumeEnergy,
      addMatter: store.addMatter,
      addRareMatter: store.addRareMatter,
      runtime,
    };
  };

  it('mines correctly when asteroid orbit motion is enabled', () => {
    const { engine } = runtime;
    engine.setBlock(0, 0, 0, BlockType.ASTEROID_SURFACE);

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(10, 0, 0), // At orbit-offset for t=0
      target: new THREE.Vector3(10, 0, 0),
      targetBlock: { x: 0, y: 0, z: 0 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_MINE',
      carryingType: null,
      miningProgress: 95,
    });

    MiningSystem(getSystemProps(0.1, 0));

    expect(drone.state).toBe('RETURNING_RESOURCE');
    expect(drone.carryingType).toBe(BlockType.ASTEROID_SURFACE);
    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.AIR);
  });

  it('drone can mine a rare ore block and transitions to RETURNING_RESOURCE', () => {
    const { engine } = runtime;
    engine.setBlock(0, 0, 0, BlockType.RARE_ORE);

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(10, 0, 0),
      target: new THREE.Vector3(10, 0, 0),
      targetBlock: { x: 0, y: 0, z: 0 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_MINE',
      carryingType: null,
      miningProgress: 99,
    });

    MiningSystem(getSystemProps(0.1, 0));

    expect(drone.state).toBe('RETURNING_RESOURCE');
    expect(drone.carryingType).toBe(BlockType.RARE_ORE);
  });

  it('drone mining rare ore deposits rare matter on return', () => {
    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'RETURNING_RESOURCE',
      carryingType: BlockType.RARE_ORE,
    });

    MiningSystem(getSystemProps(0.1, 0));

    expect(useStore.getState().rareMatter).toBe(1);
    expect(drone.state).toBe('IDLE');
    expect(drone.carryingType).toBe(null);
  });

  it('should process returning drones even if they do not have a targetBlock', () => {
    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'RETURNING_RESOURCE',
      carryingType: BlockType.ASTEROID_SURFACE,
    });

    MiningSystem(getSystemProps(0.1, 0));

    expect(useStore.getState().matter).toBe(1);
    expect(drone.state).toBe('IDLE');
  });

  it('applies MINING_SPEED_1 to increase mining progress rate', () => {
    const runWithDrillUpgrade = (enabled: boolean) => {
      ECS.clear();
      runtime = createRuntimeContext({ mesherWorkerCount: 0 });
      useStore.setState({
        upgrades: {
          MINING_SPEED_1: enabled,
          DRONE_SPEED_1: false,
          LASER_EFFICIENCY_1: false,
          AUTO_REPLICATOR: false,
          DEEP_SCAN_1: false,
          ADVANCED_EXPLORER: false,
        },
      });

      const drone = ECS.add({
        isDrone: true,
        position: new THREE.Vector3(10, 0, 0),
        target: new THREE.Vector3(10, 0, 0),
        targetBlock: { x: 0, y: 0, z: 0 },
        velocity: new THREE.Vector3(0, 0, 0),
        state: 'MOVING_TO_MINE',
        miningProgress: 0,
      });

      runtime.engine.setBlock(0, 0, 0, BlockType.ASTEROID_SURFACE);

      MiningSystem(getSystemProps(1, 0));
      return drone.miningProgress || 0;
    };

    const baseProgress = runWithDrillUpgrade(false);
    const boostedProgress = runWithDrillUpgrade(true);

    expect(baseProgress).toBe(50);
    expect(boostedProgress).toBe(75);
  });
});
