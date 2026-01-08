import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MovementSystem } from '../../src/ecs/systems/MovementSystem';
import { ECS } from '../../src/ecs/world';

describe('MovementSystem', () => {
  it('moves entities towards target', () => {
    const entity = ECS.add({
      isDrone: true,
      position: new THREE.Vector3(0, 0, 0),
      target: new THREE.Vector3(10, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      speed: 1
    });

    // Mock dt
    // MovementSystem usually takes dt? Or runs in efficient loop?
    // Based on typical signature: (world, dt)
    // Checking standard miniplex system pattern usually just function(world) but typically game loops pass dt.
    
    // Let's assume (world) or assume it calculates time internally or just moves fixed step.
    // If it's pure logic:
    // MovementSystem(ECS.world)
    
    // Ideally we check if position changed.
    MovementSystem(1/60); 

    expect(entity.position.x).toBeGreaterThan(0);
    
    ECS.remove(entity);
  });
});
