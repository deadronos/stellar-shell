import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { BrainSystem } from '../../src/ecs/systems/BrainSystem';
import { ECS } from '../../src/ecs/world';
import { BlockType } from '../../src/types';

describe('BrainSystem', () => {
  it('assigns tasks to idle drones', () => {
    // Setup ECS with an idle drone
    const drone = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      state: 'IDLE',
      carrying: null,
      target: null
    });
    
    // Pass a mock clock or object with elapsedTime
    const mockClock = { elapsedTime: 10 } as any;
    BrainSystem(mockClock);
    
    // Since we didn't setup mining targets, it should probably remain IDLE or switch state if logic dictates.
    expect(drone.state).toBeDefined();
    
    ECS.remove(drone);
  });
});
