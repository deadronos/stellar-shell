import * as THREE from 'three';
import { ECS } from '../world';
import { BlockType, DysonProgressMetrics } from '../../types';
import { FRAME_COST, SHELL_COST } from '../../constants';
import { BLOCK_COLORS } from '../../constants';
import { getAsteroidOrbitOffset } from '../../services/AsteroidOrbit';
import type { RuntimeContext } from '../RuntimeContext';

// Scratch objects reused across frames to avoid per-frame allocation.
const _scratchTarget = new THREE.Vector3();
const _scratchColor = new THREE.Color();

interface ConstructionSystemProps {
  elapsedTime: number;
  asteroidOrbitEnabled: boolean;
  asteroidOrbitRadius: number;
  asteroidOrbitSpeed: number;
  asteroidOrbitVerticalAmplitude: number;
  consumeMatter: (amount: number) => boolean;
  consumeRareMatter: (amount: number) => boolean;
  consumeEnergy: (amount: number) => boolean;
  setEnergyRate: (rate: number) => void;
  setDysonProgress: (progress: DysonProgressMetrics) => void;
  runtime: RuntimeContext;
}

export const ConstructionSystem = ({
  elapsedTime,
  asteroidOrbitEnabled,
  asteroidOrbitRadius,
  asteroidOrbitSpeed,
  asteroidOrbitVerticalAmplitude,
  consumeMatter,
  consumeRareMatter,
  consumeEnergy,
  setEnergyRate,
  setDysonProgress,
  runtime,
}: ConstructionSystemProps) => {
  const { engine, blueprints, particles } = runtime;
  const orbitOffset = getAsteroidOrbitOffset(elapsedTime, {
    enabled: asteroidOrbitEnabled,
    radius: asteroidOrbitRadius,
    speed: asteroidOrbitSpeed,
    verticalAmplitude: asteroidOrbitVerticalAmplitude,
  });
  const buildingDrones = ECS.with('isDrone', 'position', 'targetBlock', 'state', 'target');

  for (const drone of buildingDrones) {
    if (drone.state === 'MOVING_TO_BUILD' && drone.targetBlock) {
      _scratchTarget.set(
        drone.targetBlock.x + orbitOffset.x,
        drone.targetBlock.y + orbitOffset.y,
        drone.targetBlock.z + orbitOffset.z,
      );
      drone.target.copy(_scratchTarget);
      const dist = drone.position.distanceTo(drone.target);

      if (dist < 1.5) {
        const { x, y, z } = drone.targetBlock;
        const currentBlock = engine.getBlock(x, y, z);

        if (blueprints.hasBlueprint({ x, y, z })) {
          if (consumeMatter(FRAME_COST) && consumeEnergy(10)) {
            engine.setBlock(x, y, z, BlockType.FRAME);
            blueprints.removeBlueprint({ x, y, z });
            setDysonProgress(engine.computeDysonProgress());
            particles.emit(_scratchTarget, _scratchColor.set(BLOCK_COLORS[BlockType.FRAME]), 5);
          }
        } else if (currentBlock === BlockType.FRAME) {
          if (consumeMatter(FRAME_COST) && consumeEnergy(10)) {
            engine.setBlock(x, y, z, BlockType.PANEL);
            const { energyRate, dysonProgress } = engine.computeWorldDerivedMetrics();
            setEnergyRate(energyRate);
            setDysonProgress(dysonProgress);
            particles.emit(_scratchTarget, _scratchColor.set(0x00ffff), 8);
          }
        } else if (currentBlock === BlockType.PANEL) {
          if (consumeRareMatter(SHELL_COST) && consumeEnergy(50)) {
            engine.setBlock(x, y, z, BlockType.SHELL);
            const { energyRate, dysonProgress } = engine.computeWorldDerivedMetrics();
            setEnergyRate(energyRate);
            setDysonProgress(dysonProgress);
            particles.emit(_scratchTarget, _scratchColor.set(0xffaa00), 15);
          }
        }

        drone.state = 'IDLE';
        ECS.removeComponent(drone, 'target');
        ECS.removeComponent(drone, 'targetBlock');
        drone.carryingType = null;
      }
    }
  }
};
