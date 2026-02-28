import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/state/store';
import { EnergySystem } from '../../src/ecs/systems/EnergySystem';

const defaultUpgrades = {
  MINING_SPEED_1: false,
  DRONE_SPEED_1: false,
  LASER_EFFICIENCY_1: false,
  AUTO_REPLICATOR: false,
};

describe('EnergySystem', () => {
  beforeEach(() => {
    useStore.setState({
      matter: 0,
      energy: 0,
      energyGenerationRate: 0,
      droneCount: 0,
      droneCost: 50,
      upgrades: defaultUpgrades,
    });
  });

  it('auto-purchases a drone once per second when AUTO_REPLICATOR is owned and matter is sufficient', () => {
    useStore.setState({
      matter: 100,
      energyGenerationRate: 0,
      droneCount: 0,
      droneCost: 50,
      upgrades: { ...defaultUpgrades, AUTO_REPLICATOR: true },
    });

    EnergySystem(1);

    const state = useStore.getState();
    expect(state.droneCount).toBe(1);
    expect(state.matter).toBe(50);
    expect(state.droneCost).toBe(60);
  });

  it('does not auto-purchase when AUTO_REPLICATOR is not owned', () => {
    useStore.setState({
      matter: 100,
      energyGenerationRate: 0,
      droneCount: 0,
      droneCost: 50,
      upgrades: defaultUpgrades,
    });

    EnergySystem(1);

    const state = useStore.getState();
    expect(state.droneCount).toBe(0);
    expect(state.matter).toBe(100);
    expect(state.droneCost).toBe(50);
  });

  it('does not auto-purchase when matter is below drone cost', () => {
    useStore.setState({
      matter: 49,
      energyGenerationRate: 0,
      droneCount: 0,
      droneCost: 50,
      upgrades: { ...defaultUpgrades, AUTO_REPLICATOR: true },
    });

    EnergySystem(1);

    const state = useStore.getState();
    expect(state.droneCount).toBe(0);
    expect(state.matter).toBe(49);
    expect(state.droneCost).toBe(50);
  });
});
