import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType } from '../../types';
import { ParticleEvents } from '../../services/ParticleEvents';
import { BLOCK_COLORS } from '../../constants';
import { getAsteroidOrbitOffset } from '../../services/AsteroidOrbit';

const ENGINE = BvxEngine.getInstance();
const HUB_POSITION = new THREE.Vector3(0, 0, 0);

// Scratch objects reused across frames to avoid per-frame allocation.
const _scratchTarget = new THREE.Vector3();
const _scratchOffset = new THREE.Vector3();
const _scratchColor = new THREE.Color();
const _scratchRed = new THREE.Color('#ff0000');

interface MiningSystemProps {
  delta: number;
  elapsedTime: number;
  asteroidOrbitEnabled: boolean;
  asteroidOrbitRadius: number;
  asteroidOrbitSpeed: number;
  asteroidOrbitVerticalAmplitude: number;
  prestigeLevel: number;
  upgrades: Record<string, boolean>;
  consumeEnergy: (amount: number) => boolean;
  addMatter: (amount: number) => void;
  addRareMatter: (amount: number) => void;
}

export const MiningSystem = ({
  delta,
  elapsedTime,
  asteroidOrbitEnabled,
  asteroidOrbitRadius,
  asteroidOrbitSpeed,
  asteroidOrbitVerticalAmplitude,
  prestigeLevel,
  upgrades,
  consumeEnergy,
  addMatter,
  addRareMatter,
}: MiningSystemProps) => {
  const orbitOffset = getAsteroidOrbitOffset(elapsedTime, {
    enabled: asteroidOrbitEnabled,
    radius: asteroidOrbitRadius,
    speed: asteroidOrbitSpeed,
    verticalAmplitude: asteroidOrbitVerticalAmplitude,
  });
  const miningDrones = ECS.with('isDrone', 'position', 'targetBlock', 'state', 'target');
  const returningDrones = ECS.with('isDrone', 'position', 'state', 'target');

  // Performance optimization: When many drones are mining, reduce per-drone particle frequency
  // to avoid overloading the particle system and causing frame drops.
  const activeMinerCount = miningDrones.entities.length;
  const particleThreshold = activeMinerCount > 20 ? 0.3 * (20 / activeMinerCount) : 0.3;

  for (const drone of miningDrones) {
    if (drone.state === 'MOVING_TO_MINE' && drone.targetBlock) {
      _scratchTarget.set(
        drone.targetBlock.x + orbitOffset.x,
        drone.targetBlock.y + orbitOffset.y,
        drone.targetBlock.z + orbitOffset.z,
      );
      drone.target.copy(_scratchTarget);
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
          const miningMult = 1 + prestigeLevel * 0.5;
          // Upgrade Multiplier: Fast Drill +50%
          const drillMult = upgrades['MINING_SPEED_1'] ? 1.5 : 1;
          // Energy Check: Mining costs 5 energy/sec
          const energyCost = delta * 5;

          const hasEnergy = consumeEnergy(energyCost);
          if (hasEnergy) {
            drone.miningProgress += delta * 50 * miningMult * drillMult;
          } else {
            // Out of energy: slow down mining significantly
            drone.miningProgress += delta * 5 * miningMult * drillMult;
          }

          // Emit spark occasionally
          // Visual feedback: If out of energy, emit red "exhaust" sparks instead of material-colored ones
          if (Math.random() < particleThreshold) {
            const color = hasEnergy
              ? _scratchColor.set(BLOCK_COLORS[block] || '#ffffff')
              : _scratchRed;

            ParticleEvents.emit(_scratchTarget, color, 1);
          }

          if (drone.miningProgress >= 100) {
            ENGINE.setBlock(x, y, z, BlockType.AIR);

            drone.carryingType = block;
            drone.state = 'RETURNING_RESOURCE';
            drone.miningProgress = 0;

            // Set new target: Hub
            _scratchOffset.set(
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 4,
              (Math.random() - 0.5) * 8,
            );
            drone.target.copy(HUB_POSITION).add(_scratchOffset);
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
        if (drone.carryingType === BlockType.ASTEROID_CORE) addMatter(2);
        else if (drone.carryingType === BlockType.RARE_ORE) {
          const yieldAmount = upgrades['DEEP_SCAN_1'] ? 2 : 1;
          addRareMatter(yieldAmount);
        } else addMatter(1);

        drone.carryingType = null;
        drone.state = 'IDLE';
        ECS.removeComponent(drone, 'target');
      }
    }
  }
};
