import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType } from '../../types';
import { useStore } from '../../state/store';
import { ParticleEvents } from '../../services/ParticleEvents';
import { BLOCK_COLORS } from '../../constants';

const ENGINE = BvxEngine.getInstance();
const HUB_POSITION = new THREE.Vector3(0, 0, 0);

export const MiningSystem = (delta: number) => {
  const store = useStore.getState();
  const miningDrones = ECS.with('isDrone', 'position', 'targetBlock', 'state', 'target');
  const returningDrones = ECS.with('isDrone', 'position', 'state', 'target');

  for (const drone of miningDrones) {
    if (drone.state === 'MOVING_TO_MINE' && drone.targetBlock) {
      const dist = drone.position.distanceTo(drone.target);
      // Arrival Check
      if (dist < 1.5) {
        const { x, y, z } = drone.targetBlock;
        const block = ENGINE.getBlock(x, y, z);

        if (
          block === BlockType.ASTEROID_SURFACE ||
          block === BlockType.ASTEROID_CORE ||
          block === BlockType.RARE_ORE
        ) {
          // Mining Progress Logic
          if (!drone.miningProgress) drone.miningProgress = 0;

          // Prestige Multiplier: +50% Mining Speed per level
          const miningMult = 1 + store.prestigeLevel * 0.5;
          drone.miningProgress += delta * 50 * miningMult;

          // Emit spark occasionally
          if (Math.random() < 0.3) {
            const colorHex = BLOCK_COLORS[block] || '#ffffff';
            ParticleEvents.emit(
              new THREE.Vector3(x, y, z),
              new THREE.Color(colorHex),
              1,
            );
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
          // Fail (Block gone?)
          drone.state = 'IDLE';
          ECS.removeComponent(drone, 'target');
          ECS.removeComponent(drone, 'targetBlock');
          drone.miningProgress = 0;
        }
      }
    }
  }

  // Handle returning drones separately since they lose the 'targetBlock' component
  for (const drone of returningDrones) {
    if (drone.state === 'RETURNING_RESOURCE') {
      const dist = drone.position.distanceTo(drone.target);
      if (dist < 1.5) {
        if (drone.carryingType === BlockType.ASTEROID_CORE) store.addMatter(2);
        else if (drone.carryingType === BlockType.RARE_ORE) store.addRareMatter(1);
        else store.addMatter(1);

        drone.carryingType = null;
        drone.state = 'IDLE';
        ECS.removeComponent(drone, 'target');
      }
    }
  }
};
