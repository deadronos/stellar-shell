import { describe, it, expect } from 'vitest';
import { ECS } from '../../src/ecs/world';
import * as THREE from 'three';

describe('ECS World', () => {
  it('initializes with correct archetypes', () => {
    // Basic sanity check that global ECS is accessible
    expect(ECS).toBeDefined();
    expect(ECS.entities).toBeDefined();
  });

  it('allows adding and removing entities', () => {
    const entity = ECS.add({
        position: new THREE.Vector3(10, 10, 10)
    });
    
    expect(ECS.entities.includes(entity)).toBe(true);
    
    ECS.remove(entity);
    expect(ECS.entities.includes(entity)).toBe(false);
  });
});
