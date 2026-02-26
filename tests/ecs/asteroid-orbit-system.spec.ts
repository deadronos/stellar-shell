import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { ECS } from '../../src/ecs/world';
import { AsteroidOrbitSystem } from '../../src/ecs/systems/AsteroidOrbitSystem';
import { useStore } from '../../src/state/store';

describe('AsteroidOrbitSystem', () => {
  beforeEach(() => {
    ECS.clear();
  });

  afterEach(() => {
    ECS.clear();
  });

  it('updates chunk positions when orbit is enabled and resets when disabled', () => {
    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '1,0,0',
      chunkPosition: { x: 1, y: 0, z: 0 },
      position: new THREE.Vector3(16, 0, 0),
    });

    useStore.setState({
      asteroidOrbitEnabled: true,
      asteroidOrbitRadius: 10,
      asteroidOrbitSpeed: 1,
      asteroidOrbitVerticalAmplitude: 0,
    });

    AsteroidOrbitSystem(Math.PI / 2);
    expect(chunk.position.x).toBeCloseTo(16, 5);
    expect(chunk.position.z).toBeCloseTo(10, 5);

    useStore.setState({ asteroidOrbitEnabled: false });
    AsteroidOrbitSystem(Math.PI / 2);
    expect(chunk.position.x).toBeCloseTo(16, 5);
    expect(chunk.position.z).toBeCloseTo(0, 5);
  });
});
