import * as THREE from 'three';
import { ECS } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { BlockType } from '../../types';
import { useStore } from '../../state/store';
import { FRAME_COST } from '../../constants';
import { BlueprintManager } from '../../services/BlueprintManager';
import { getAsteroidOrbitOffset } from '../../services/AsteroidOrbit';

const ENGINE = BvxEngine.getInstance();
const SPEED = 15;

export const PlayerSystem = (delta: number, elapsedTime: number = 0) => {
  const players = ECS.with('isPlayer', 'position', 'input', 'cameraQuaternion');
  const store = useStore.getState();
  const orbitOffset = getAsteroidOrbitOffset(elapsedTime, {
    enabled: store.asteroidOrbitEnabled,
    radius: store.asteroidOrbitRadius,
    speed: store.asteroidOrbitSpeed,
    verticalAmplitude: store.asteroidOrbitVerticalAmplitude,
  });

  for (const player of players) {
    const { input, cameraQuaternion, position } = player;

    // --- 1. Movement Logic ---
    const quaternion = new THREE.Quaternion(cameraQuaternion.x, cameraQuaternion.y, cameraQuaternion.z, cameraQuaternion.w);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

    const moveVec = new THREE.Vector3();
    if (input.forward) moveVec.add(forward);
    if (input.backward) moveVec.sub(forward);
    if (input.right) moveVec.add(right);
    if (input.left) moveVec.sub(right);
    if (input.up) moveVec.add(up);
    if (input.down) moveVec.sub(up);

    if (moveVec.length() > 0) {
      moveVec.normalize().multiplyScalar(SPEED * delta);
      position.add(moveVec);
    }

    // --- 2. Interaction Logic (Raycast) ---
    // Only process if user is trying to interact
    if (input.mine || input.build) {
        // Debounce or rate limit could be added here if not handled by input state clearing
        // For this implementation, we assume `input.mine` is a frame-valid signal (or we handle continuous mining here)
        
        // Raycast from player position in look direction
        const rayDir = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
        
        // DDA Raycast
        const maxDist = 8;
        const step = 0.1;
        const rayPos = position.clone();
        
        let hitBlock = null;
        const hitPos = new THREE.Vector3();
        const lastAirPos = new THREE.Vector3();

        for (let d = 0; d < maxDist; d += step) {
            const testPos = rayPos.clone().add(rayDir.clone().multiplyScalar(d));
            const bx = Math.floor(testPos.x - orbitOffset.x);
            const by = Math.floor(testPos.y - orbitOffset.y);
            const bz = Math.floor(testPos.z - orbitOffset.z);

            const block = ENGINE.getBlock(bx, by, bz);
             if (block !== BlockType.AIR && !(store.selectedTool === 'BUILD' && block === BlockType.FRAME)) {
                hitBlock = block;
                hitPos.set(bx, by, bz);
                break;
            }
            lastAirPos.set(bx, by, bz);
        }

        if (input.mine && store.selectedTool === 'LASER') {
             if (hitBlock) {
                 ENGINE.setBlock(hitPos.x, hitPos.y, hitPos.z, BlockType.AIR);
                 // Laser Capacitor upgrade: 2× resource yield
                 const laserMult = store.upgrades['LASER_EFFICIENCY_1'] ? 2 : 1;
                 // Determine resource
                 if (hitBlock === BlockType.ASTEROID_CORE) store.addMatter(2 * laserMult);
                 else if (hitBlock === BlockType.ASTEROID_SURFACE) store.addMatter(1 * laserMult);
                 else if (hitBlock === BlockType.RARE_ORE) store.addRareMatter(1 * laserMult);
                 else if (hitBlock === BlockType.FRAME) {
                    store.addMatter(FRAME_COST); // Recycle
                    store.setDysonProgress(ENGINE.computeDysonProgress());
                 }
                  else if (hitBlock === BlockType.BLUEPRINT_FRAME) {
                    BlueprintManager.getInstance().removeBlueprint({
                      x: hitPos.x,
                      y: hitPos.y,
                      z: hitPos.z,
                    });
                    store.setDysonProgress(ENGINE.computeDysonProgress());
                  }
                  else if (hitBlock === BlockType.PANEL || hitBlock === BlockType.SHELL) {
                      // Reconcile energy rate from actual world state after removal
                      const { energyRate, dysonProgress } = ENGINE.computeWorldDerivedMetrics();
                      store.setEnergyRate(energyRate);
                      store.setDysonProgress(dysonProgress);
                  }
              }
        }else if (input.build && store.selectedTool === 'BUILD') {
             // Logic: Set voxel to 'BLUEPRINT_FRAME' (visual ghost) and register in manager.
             const current = ENGINE.getBlock(lastAirPos.x, lastAirPos.y, lastAirPos.z);
              if (current === BlockType.AIR) {
                  ENGINE.setBlock(lastAirPos.x, lastAirPos.y, lastAirPos.z, BlockType.BLUEPRINT_FRAME);
                  BlueprintManager.getInstance().addBlueprint(lastAirPos);
                  store.setDysonProgress(ENGINE.computeDysonProgress());
              }
         }
        
        // Reset impulse inputs instantly after processing (simulating a 'click' rather than hold, unless we want rapid fire)
        // For now, let's reset them so we don't spam-mine in one keypress if the system runs faster than input updates?
        // Actually, PlayerController sets/clears keys on keyup/down.
        // But `mine` usually comes from click.
        // We need the Controller to handle "Click" vs "Hold".
        // If we want "Click" behavior, we should consume the flag.
        player.input.mine = false;
        player.input.build = false;
    }
  }
};
