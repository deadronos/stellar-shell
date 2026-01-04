import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType } from '../../types';
import { useStore } from '../../state/store';
import { FRAME_COST, SHELL_COST } from '../../constants';
import { BlueprintManager } from '../../services/BlueprintManager';
import { ParticleEvents } from '../../services/ParticleEvents';
import { BLOCK_COLORS } from '../../constants';

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
        const currentBlock = ENGINE.getBlock(x, y, z);
        
        if (BlueprintManager.getInstance().hasBlueprint({ x, y, z })) {
           if (store.consumeMatter(FRAME_COST)) {
             ENGINE.setBlock(x, y, z, BlockType.FRAME);
             BlueprintManager.getInstance().removeBlueprint({ x, y, z });
             ParticleEvents.emit(new THREE.Vector3(x, y, z), new THREE.Color(BLOCK_COLORS[BlockType.FRAME]), 5);
           }
        } else if (currentBlock === BlockType.FRAME) {
          if (store.consumeMatter(FRAME_COST)) {
            ENGINE.setBlock(x, y, z, BlockType.PANEL);
            store.setEnergyRate(store.energyGenerationRate + 1);
            ParticleEvents.emit(new THREE.Vector3(x, y, z), new THREE.Color(0x00ffff), 8);
          }
        } else if (currentBlock === BlockType.PANEL) {
          if (store.consumeRareMatter(SHELL_COST)) {
            ENGINE.setBlock(x, y, z, BlockType.SHELL);
            store.setEnergyRate(store.energyGenerationRate + 5); 
            ParticleEvents.emit(new THREE.Vector3(x, y, z), new THREE.Color(0xffaa00), 15);
          }
        }
        
        drone.state = 'IDLE';
        ECS.removeComponent(drone, 'target');
        ECS.removeComponent(drone, 'targetBlock');
        drone.carryingType = null;

      } else if (drone.state === 'MOVING_TO_MINE' && drone.targetBlock) {
        const { x, y, z } = drone.targetBlock;
        const block = ENGINE.getBlock(x, y, z);
        
        if (block === BlockType.ASTEROID_SURFACE || block === BlockType.ASTEROID_CORE || block === BlockType.RARE_ORE) {
           // Mining Progress Logic
           if (!drone.miningProgress) drone.miningProgress = 0;
           
           // Prestige Multiplier: +50% Mining Speed per level
           const miningMult = 1 + (store.prestigeLevel * 0.5);
           drone.miningProgress += (delta * 50) * miningMult; 
           
           // Emit spark occasionally
           if (Math.random() < 0.3) {
             const colorHex = BLOCK_COLORS[block] || '#ffffff';
             ParticleEvents.emit(new THREE.Vector3(x, y, z), new THREE.Color(colorHex), 1);
           }
           
           if (drone.miningProgress >= 100) {
              ENGINE.setBlock(x, y, z, BlockType.AIR);
              
              drone.carryingType = block;
              drone.state = 'RETURNING_RESOURCE';
              drone.miningProgress = 0;

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
           }
           // Else: Stay here and keep mining next frame

        } else {
          // Fail
          drone.state = 'IDLE';
          ECS.removeComponent(drone, 'target');
          ECS.removeComponent(drone, 'targetBlock');
          drone.miningProgress = 0;
        }

      } else if (drone.state === 'RETURNING_RESOURCE') {
        if (drone.carryingType === BlockType.ASTEROID_CORE) store.addMatter(2);
        else if (drone.carryingType === BlockType.RARE_ORE) store.addRareMatter(1);
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
