import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { MiningSystem } from '../../src/ecs/systems/MiningSystem';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';

describe('MiningSystem', () => {
  beforeEach(() => {
    ECS.clear();
    useStore.setState({ matter: 0, rareMatter: 0 });
  });

  afterEach(() => {
    ECS.clear();
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
});
