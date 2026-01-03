import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType } from '../../types';
import { useStore } from '../../state/store';
import { FRAME_COST } from '../../constants';

const ENGINE = BvxEngine.getInstance();
const DRONE_SPEED = 20;
const HUB_POSITION = new THREE.Vector3(0, 0, 0);

// We need a way to spawn explosions (Particles). 
// Since systems are pure logic, we can trigger an event or write to a "ParticleRequest" queue in ECS.
// For now, let's assume we can treat particles as ECS entities or just keep it simple and maybe pass a callback?
// Refactoring to "pure" systems often means logic doesn't touch the renderer directly.
// The Drones.tsx used to manage particles.
// Let's create an "EffectEvent" queue/singleton we can push to, or use Miniplex to spawn "Particle" entities.
// For simplicity, we'll assume particles are handled visually, but we need to trigger them.
// Let's import a global event bus or just export a queue?
// ACTUALLY, checking Drones.tsx, it manages `particles` ref directly.
// To decouple, we should spawn "Explosion" entities in ECS that a RenderSystem consumes.
// But `Drones.tsx` particle system is "legacy array based".
// Let's stick to modifying state/voxel world here.
// We can skip the visual explosion for a moment or add a temporary solution.
// I will just omit the `spawnExplosion` visual call for now to keep it clean, or todo it.

export const MovementSystem = (delta: number) => {
  const store = useStore.getState();
  const movingDrones = ECS.with('isDrone', 'position', 'velocity', 'target');

  for (const drone of movingDrones) {
    if (!drone.target || !drone.velocity) continue;

    const distToTarget = drone.position.distanceTo(drone.target);
    const isOrbiting = drone.state === 'IDLE'; 

    // Arrival Check
    if (!isOrbiting && distToTarget < 1.5) {
      if (drone.state === 'MOVING_TO_BUILD' && drone.targetBlock) {
        const { x, y, z } = drone.targetBlock;
        if (ENGINE.getBlock(x, y, z) === BlockType.FRAME) {
          if (store.consumeMatter(FRAME_COST)) {
            ENGINE.setBlock(x, y, z, BlockType.PANEL);
            // TODO: Spawn Explosion Event (spawnExplosion(drone.target, '#00d0ff', 12))
          }
        }
        // Reset
        drone.state = 'IDLE';
        ECS.removeComponent(drone, 'target');
        ECS.removeComponent(drone, 'targetBlock');
        drone.carryingType = null;

      } else if (drone.state === 'MOVING_TO_MINE' && drone.targetBlock) {
        const { x, y, z } = drone.targetBlock;
        const block = ENGINE.getBlock(x, y, z);
        if (block === BlockType.ASTEROID_SURFACE || block === BlockType.ASTEROID_CORE) {
          ENGINE.setBlock(x, y, z, BlockType.AIR);
          // TODO: Spawn Explosion Event
          
          drone.carryingType = block;
          drone.state = 'RETURNING_RESOURCE';

          // Set new target: Hub
          const returnPos = HUB_POSITION.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 8,
            ),
          );
          drone.target.copy(returnPos);
          ECS.removeComponent(drone, 'targetBlock');

        } else {
          // Fail
          drone.state = 'IDLE';
          ECS.removeComponent(drone, 'target');
          ECS.removeComponent(drone, 'targetBlock');
        }

      } else if (drone.state === 'RETURNING_RESOURCE') {
        if (drone.carryingType === BlockType.ASTEROID_CORE) store.addMatter(2);
        else store.addMatter(1);

        drone.carryingType = null;
        drone.state = 'IDLE';
        ECS.removeComponent(drone, 'target');

      } else {
        // Fallback
        if (isOrbiting) ECS.removeComponent(drone, 'target');
      }

      drone.velocity.multiplyScalar(0.5);

    } else {
      // STEERING
      if (drone.target) {
        const desired = new THREE.Vector3().subVectors(drone.target, drone.position);
        const dist = desired.length();
        desired.normalize();

        if (!isOrbiting && dist < 5) {
          desired.multiplyScalar(DRONE_SPEED * (dist / 5));
        } else {
          desired.multiplyScalar(DRONE_SPEED);
        }

        const steer = new THREE.Vector3().subVectors(desired, drone.velocity);
        steer.clampLength(0, 35 * delta);
        drone.velocity.add(steer);
      }
    }
  }

  // SEPARATION Logic
  const allDrones = ECS.with('isDrone', 'position', 'velocity').entities;
  const count = allDrones.length;

  for (let i = 0; i < count; i++) {
    const d1 = allDrones[i];
    if (!d1.velocity) continue;

    const separation = new THREE.Vector3();
    let neighbors = 0;

    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const d2 = allDrones[j];

      const distSq = d1.position.distanceToSquared(d2.position);
      if (distSq > 0 && distSq < 6.25) { // 2.5^2
        const dist = Math.sqrt(distSq);
        const push = new THREE.Vector3().subVectors(d1.position, d2.position).normalize();
        push.divideScalar(dist);
        separation.add(push);
        neighbors++;
      }
    }

    if (neighbors > 0) {
      separation.divideScalar(neighbors).multiplyScalar(20 * delta);
      d1.velocity.add(separation);
    }

    d1.velocity.clampLength(0, DRONE_SPEED);
    d1.position.add(d1.velocity.clone().multiplyScalar(delta));
  }
};
