import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { ConstructionSystem } from '../../src/ecs/systems/ConstructionSystem';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';
import { BvxEngine } from '../../src/services/BvxEngine';

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
});
