import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';
import { ExplorerSystem, RESEARCH_RATE } from '../../src/ecs/systems/ExplorerSystem';

const defaultUpgrades = {
  MINING_SPEED_1: false,
  DRONE_SPEED_1: false,
  LASER_EFFICIENCY_1: false,
  AUTO_REPLICATOR: false,
  DEEP_SCAN_1: false,
  ADVANCED_EXPLORER: false,
};

describe('ExplorerSystem', () => {
  beforeEach(() => {
    ECS.clear();
    useStore.setState({ research: 0, upgrades: defaultUpgrades });
  });

  it('does not generate research when no drones are exploring', () => {
    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carryingType: null,
    });

    // delta = 2 gives 0 drones * 0.5 * 1 * 2 = 0 → no research
    ExplorerSystem(2);
    expect(useStore.getState().research).toBe(0);
  });

  it('generates research when a drone is in EXPLORING state', () => {
    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      state: 'EXPLORING',
      carryingType: null,
    });

    // delta = 2: 1 drone * RESEARCH_RATE * 1 * 2 = 1.0 → addResearch(1)
    ExplorerSystem(2);
    expect(useStore.getState().research).toBe(Math.floor(1 * RESEARCH_RATE * 2));
  });

  it('accumulates more research with multiple exploring drones', () => {
    for (let i = 0; i < 3; i++) {
      ECS.add({
        isDrone: true,
        position: new THREE.Vector3(0, 0, 0),
        state: 'EXPLORING',
        carryingType: null,
      });
    }

    // delta = 2: 3 drones * 0.5 * 1 * 2 = 3.0 → addResearch(3)
    ExplorerSystem(2);
    expect(useStore.getState().research).toBe(Math.floor(3 * RESEARCH_RATE * 2));
  });

  it('doubles research rate when ADVANCED_EXPLORER upgrade is active', () => {
    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      state: 'EXPLORING',
      carryingType: null,
    });

    useStore.setState({ upgrades: { ...defaultUpgrades, ADVANCED_EXPLORER: true } });

    // delta = 2: 1 drone * 0.5 * 2 * 2 = 2.0 → addResearch(2)
    ExplorerSystem(2);
    expect(useStore.getState().research).toBe(Math.floor(1 * RESEARCH_RATE * 2 * 2));
  });

  it('does not generate research for drones in non-EXPLORING states', () => {
    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_MINE',
      carryingType: null,
    });
    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      state: 'RETURNING_RESOURCE',
      carryingType: null,
    });

    ExplorerSystem(2);
    expect(useStore.getState().research).toBe(0);
  });
});
