import * as THREE from 'three';
import { ECS, Entity } from './world';
import { getNextDroneEntityId } from './droneIdAllocator';

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
  }
};
