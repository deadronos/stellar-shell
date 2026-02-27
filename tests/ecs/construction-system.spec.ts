import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { ConstructionSystem } from '../../src/ecs/systems/ConstructionSystem';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';
import { BvxEngine } from '../../src/services/BvxEngine';
import { FRAME_COST, PANEL_ENERGY_RATE, SHELL_COST, SHELL_ENERGY_RATE } from '../../src/constants';

describe('ConstructionSystem', () => {
  beforeEach(() => {
    ECS.clear();
    useStore.setState({
      matter: 10,
      rareMatter: 0,
      energyGenerationRate: 0,
      asteroidOrbitEnabled: true,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });
  });

  afterEach(() => {
    ECS.clear();
  });

  it('builds correctly when asteroid orbit motion is enabled', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();
    engine.setBlock(1, 1, 1, BlockType.FRAME);

    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(11, 1, 1),
      target: new THREE.Vector3(1, 1, 1),
      targetBlock: { x: 1, y: 1, z: 1 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_BUILD',
      carryingType: BlockType.FRAME,
      miningProgress: 0,
    });

    ConstructionSystem(1 / 60, 0);

    expect(drone.state).toBe('IDLE');
    expect(engine.getBlock(1, 1, 1)).toBe(BlockType.PANEL);
  });

  it('reconciles energy rate from world state when upgrading FRAME to PANEL', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    useStore.setState({
      matter: FRAME_COST,
      rareMatter: 0,
      energyGenerationRate: 99,
      asteroidOrbitEnabled: false,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });

    engine.setBlock(0, 0, 0, BlockType.FRAME);

    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      targetBlock: { x: 0, y: 0, z: 0 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_BUILD',
      carryingType: BlockType.FRAME,
      miningProgress: 0,
    });

    ConstructionSystem(1 / 60, 0);

    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.PANEL);
    expect(useStore.getState().energyGenerationRate).toBe(PANEL_ENERGY_RATE);
    expect(useStore.getState().matter).toBe(0);
  });

  it('reconciles energy rate from world state when upgrading PANEL to SHELL', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    useStore.setState({
      matter: 0,
      rareMatter: SHELL_COST,
      energyGenerationRate: PANEL_ENERGY_RATE,
      asteroidOrbitEnabled: false,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });

    engine.setBlock(0, 0, 0, BlockType.PANEL);

    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      targetBlock: { x: 0, y: 0, z: 0 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_BUILD',
      carryingType: BlockType.PANEL,
      miningProgress: 0,
    });

    ConstructionSystem(1 / 60, 0);

    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.SHELL);
    expect(useStore.getState().energyGenerationRate).toBe(SHELL_ENERGY_RATE);
    expect(useStore.getState().rareMatter).toBe(0);
  });

  // negative case: insufficient resources should leave world unchanged
  it('does not upgrade when resources are insufficient', () => {
    const engine = BvxEngine.getInstance();
    engine.resetWorld();

    // start with a panel but zero rareMatter and zero matter
    useStore.setState({
      matter: 0,
      rareMatter: 0,
      energyGenerationRate: PANEL_ENERGY_RATE,
      asteroidOrbitEnabled: false,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });

    engine.setBlock(0, 0, 0, BlockType.PANEL);

    ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      target: new THREE.Vector3(0, 0, 0),
      targetBlock: { x: 0, y: 0, z: 0 },
      velocity: new THREE.Vector3(0, 0, 0),
      state: 'MOVING_TO_BUILD',
      carryingType: BlockType.PANEL,
      miningProgress: 0,
    });

    ConstructionSystem(1 / 60, 0);

    expect(engine.getBlock(0, 0, 0)).toBe(BlockType.PANEL);
    // energy rate should remain unchanged since nothing changed
    expect(useStore.getState().energyGenerationRate).toBe(PANEL_ENERGY_RATE);
    expect(useStore.getState().rareMatter).toBe(0);
    expect(useStore.getState().matter).toBe(0);
  });
});
