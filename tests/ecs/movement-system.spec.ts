import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { MovementSystem } from '../../src/ecs/systems/MovementSystem';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';

describe('MovementSystem', () => {
  beforeEach(() => {
    ECS.clear();
    useStore.setState({
      energy: 1000,
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
  });

  const getSystemProps = (delta: number = 1 / 60) => {
    const store = useStore.getState();
    return {
      delta,
      energy: store.energy,
      prestigeLevel: store.prestigeLevel,
      upgrades: store.upgrades,
    };
  };

  it('moves entities towards target', () => {
    const entity = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      target: new THREE.Vector3(10, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
    });

    MovementSystem(getSystemProps(1 / 60));

    expect(entity.position.x).toBeGreaterThan(0);

    ECS.remove(entity);
  });

  it('applies DRONE_SPEED_1 to increase effective movement speed', () => {
    const runWithThrusterUpgrade = (enabled: boolean) => {
      ECS.clear();
      useStore.setState({
        prestigeLevel: 0,
        upgrades: {
          MINING_SPEED_1: false,
          DRONE_SPEED_1: enabled,
          LASER_EFFICIENCY_1: false,
          AUTO_REPLICATOR: false,
          DEEP_SCAN_1: false,
          ADVANCED_EXPLORER: false,
        },
      });

      const drone = ECS.add({
        isDrone: true,
        position: new THREE.Vector3(0, 0, 0),
        target: new THREE.Vector3(100, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
      });

      MovementSystem(getSystemProps(1));
      return drone.position.x;
    };

    const baseDistance = runWithThrusterUpgrade(false);
    const boostedDistance = runWithThrusterUpgrade(true);

    expect(baseDistance).toBeCloseTo(20, 5);
    expect(boostedDistance).toBeGreaterThan(baseDistance);
    expect(boostedDistance).toBeCloseTo(30, 5);
  });

  it('treats EXPLORING as orbiting (no near-target braking)', () => {
    const runWithState = (state: 'EXPLORING' | 'MOVING_TO_MINE') => {
      ECS.clear();

      const drone = ECS.add({
        isDrone: true,
        position: new THREE.Vector3(0, 0, 0),
        target: new THREE.Vector3(1, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        state,
      });

      MovementSystem(getSystemProps(1));
      return drone.position.x;
    };

    const exploringDistance = runWithState('EXPLORING');
    const miningDistance = runWithState('MOVING_TO_MINE');

    expect(exploringDistance).toBeGreaterThan(miningDistance);
  });
});
