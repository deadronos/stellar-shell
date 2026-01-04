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

export const ConstructionSystem = (_delta: number) => {
  const store = useStore.getState();
  const buildingDrones = ECS.with('isDrone', 'position', 'targetBlock', 'state', 'target');

  for (const drone of buildingDrones) {
    if (drone.state === 'MOVING_TO_BUILD' && drone.targetBlock) {
        const dist = drone.position.distanceTo(drone.target);
        
        if (dist < 1.5) {
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
        }
    }
  }
};
