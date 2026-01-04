import * as THREE from 'three';
import { ECS } from '../world';
import { useStore } from '../../state/store';

const DRONE_SPEED = 20;

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

    const isOrbiting = drone.state === 'IDLE'; 

    // STEERING
    if (drone.target) {
        const desired = new THREE.Vector3().subVectors(drone.target, drone.position);
        const dist = desired.length();
        desired.normalize();

        // Prestige Modifier: +50% Speed per level
        const speedMult = 1 + (store.prestigeLevel * 0.5);
        const currentDataSpeed = DRONE_SPEED * speedMult;

        if (!isOrbiting && dist < 5) {
          desired.multiplyScalar(currentDataSpeed * (dist / 5));
        } else {
          desired.multiplyScalar(currentDataSpeed);
        }

        const steer = new THREE.Vector3().subVectors(desired, drone.velocity);
        steer.clampLength(0, 35 * delta);
        drone.velocity.add(steer);
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
