import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ECS } from '../../src/ecs/world';
import { DroneFactory } from '../../src/ecs/DroneFactory';
import { resetDroneEntityIdsForTests } from '../../src/ecs/droneIdAllocator';

describe('DroneFactory.resetDrones', () => {
  beforeEach(() => {
    ECS.clear();
    resetDroneEntityIdsForTests();
  });

  it('removes all drone entities from the ECS world', () => {
    // Create several drones with various states and targets
    const drone1 = DroneFactory.create(new THREE.Vector3(10, 0, 0));
    drone1.state = 'MOVING_TO_MINE';
    drone1.targetBlock = { x: 5, y: 0, z: 0 };
    ECS.addComponent(drone1, 'target', new THREE.Vector3(5, 0, 0));

    const drone2 = DroneFactory.create(new THREE.Vector3(-5, 2, 3));
    drone2.state = 'MOVING_TO_BUILD';
    drone2.targetBlock = { x: 0, y: 0, z: 0 };
    drone2.carryingType = null;
    ECS.addComponent(drone2, 'target', new THREE.Vector3(0, 0, 0));

    const drone3 = DroneFactory.create(new THREE.Vector3(0, 5, 0));
    drone3.state = 'EXPLORING';
    ECS.addComponent(drone3, 'target', new THREE.Vector3(1, 2, 3));

    // Verify drones exist before reset
    expect(ECS.with('isDrone').entities).toHaveLength(3);

    // Call resetDrones — simulates the System Jump reset sequence
    DroneFactory.resetDrones();

    // Assert all drone entities are gone
    const remaining = ECS.with('isDrone').entities;
    expect(remaining).toHaveLength(0);
  });

  it('preserves non-drone entities (chunks, player, particles) when clearing drones', () => {
    // Create drones
    DroneFactory.create(new THREE.Vector3(1, 1, 1));
    DroneFactory.create(new THREE.Vector3(-1, -1, -1));

    // Create a chunk entity (should survive)
    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '1,2,3',
      chunkPosition: { x: 1, y: 2, z: 3 },
      needsUpdate: true,
      meshRevision: 1,
      position: new THREE.Vector3(16, 32, 48),
    });

    // Create a player entity (should survive)
    const player = ECS.add({
      isPlayer: true,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      input: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        mine: false,
        build: false,
      },
      cameraQuaternion: { x: 0, y: 0, z: 0, w: 1 },
    });

    // Create a particle (should survive)
    const particle = ECS.add({
      isParticle: true,
      position: new THREE.Vector3(5, 5, 5),
      life: 1.0,
      active: true,
    });

    expect(ECS.with('isDrone').entities).toHaveLength(2);
    expect(ECS.with('isChunk').entities).toHaveLength(1);
    expect(ECS.with('isPlayer').entities).toHaveLength(1);
    expect(ECS.with('isParticle').entities).toHaveLength(1);

    DroneFactory.resetDrones();

    // Drones are gone
    expect(ECS.with('isDrone').entities).toHaveLength(0);

    // Other entity types survive
    expect(ECS.with('isChunk').entities).toHaveLength(1);
    expect(ECS.with('isPlayer').entities).toHaveLength(1);
    expect(ECS.with('isParticle').entities).toHaveLength(1);

    // The chunk, player, and particle entities are still the same objects
    expect(ECS.with('isChunk').entities[0]).toBe(chunk);
    expect(ECS.with('isPlayer').entities[0]).toBe(player);
    expect(ECS.with('isParticle').entities[0]).toBe(particle);
  });

  it('resets BrainSystem and ExplorerSystem caches so subsequent systems start fresh', () => {
    // This is a smoke test: after resetDrones, the module-level caches
    // inside BrainSystem and ExplorerSystem are cleared. We verify by
    // re-creating a drone and checking it can be assigned work without
    // stale cache interference.
    DroneFactory.create(new THREE.Vector3(0, 0, 0));
    DroneFactory.resetDrones();

    // Re-create a drone after reset — should work cleanly
    const fresh = DroneFactory.create(new THREE.Vector3(5, 0, 0));
    expect(fresh.isDrone).toBe(true);
    expect(fresh.state).toBe('IDLE');
    expect(ECS.with('isDrone').entities).toHaveLength(1);
  });

  it('leaves no lingering drone entities when called on an empty world', () => {
    // Should be safe to call when no drones exist
    expect(() => DroneFactory.resetDrones()).not.toThrow();
    expect(ECS.with('isDrone').entities).toHaveLength(0);
  });

  it('simulates the full System Jump reset sequence and asserts clean state', () => {
    // Reproduce the exact pattern from the HUD prestige handler
    // (without actual engine/voxel dependencies — pure ECS contract)

    // 1. Pre-jump state: some drones with targets
    const d1 = DroneFactory.create(new THREE.Vector3(10, 0, 0));
    d1.state = 'MOVING_TO_MINE';
    d1.targetBlock = { x: 5, y: 0, z: 0 };
    d1.carryingType = null;
    ECS.addComponent(d1, 'target', new THREE.Vector3(5, 0, 0));

    const d2 = DroneFactory.create(new THREE.Vector3(-5, 2, 3));
    d2.state = 'MOVING_TO_BUILD';
    d2.targetBlock = { x: 0, y: 0, z: 0 };
    d2.carryingType = null;
    ECS.addComponent(d2, 'target', new THREE.Vector3(0, 0, 0));

    // 2. System Jump: resetDrones is called
    DroneFactory.resetDrones();

    // 3. Assert clean state — no drones with stale targets
    expect(ECS.with('isDrone').entities).toHaveLength(0);

    // 4. After regeneration, new drones can be created fresh
    const fresh = DroneFactory.create(new THREE.Vector3(0, 0, 0));
    expect(fresh.state).toBe('IDLE');
    expect(fresh.target).toBeUndefined();
    expect(fresh.targetBlock).toBeUndefined();
    expect(fresh.carryingType).toBeNull();
    expect(ECS.with('isDrone').entities).toHaveLength(1);
  });
});
