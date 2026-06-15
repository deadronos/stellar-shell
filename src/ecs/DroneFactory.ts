import * as THREE from 'three';
import { ECS, Entity } from './world';
import { getNextDroneEntityId } from './droneIdAllocator';
import { resetBrainSystemCaches } from './systems/BrainSystem';
import { resetExplorerSystem } from './systems/ExplorerSystem';

export const DroneFactory = {
  create(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): Entity {
    return ECS.add({
      id: getNextDroneEntityId(),
      position: position.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      isDrone: true,
      state: 'IDLE',
      carryingType: null,
      color: new THREE.Color('#ffcc00'),
    });
  },

  destroy(entity: Entity) {
    ECS.remove(entity);
  },

  /**
   * Synchronously remove all drone entities and reset module-level system caches.
   * Call during world reset / System Jump to prevent stale drone targets from
   * being processed in a frame before React re-syncs through `droneCount`.
   */
  resetDrones(): void {
    const drones = ECS.with('isDrone');
    for (const drone of [...drones.entities]) {
      ECS.remove(drone);
    }
    resetBrainSystemCaches();
    resetExplorerSystem();
  },
};
