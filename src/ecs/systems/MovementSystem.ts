import * as THREE from 'three';
import { ECS } from '../world';

const DRONE_SPEED = 20;
const MAX_SEPARATION_DISTANCE_SQ = 6.25; // 2.5^2

const steeringDesired = new THREE.Vector3();
const steeringDelta = new THREE.Vector3();
const separationPush = new THREE.Vector3();

interface MovementSystemProps {
  delta: number;
  energy: number;
  prestigeLevel: number;
  upgrades: Record<string, boolean>;
}

export const MovementSystem = ({ delta, energy, prestigeLevel, upgrades }: MovementSystemProps) => {
  const speedMult = 1 + (prestigeLevel * 0.5);
  const thrusterMult = upgrades['DRONE_SPEED_1'] ? 1.5 : 1;

  // Low Power mode: Reduce speed by 75% when energy is depleted
  const energyMult = energy > 0 ? 1 : 0.25;

  const maxDroneSpeed = DRONE_SPEED * speedMult * thrusterMult * energyMult;
  const movingDrones = ECS.with('isDrone', 'position', 'velocity', 'target');

  for (const drone of movingDrones) {
    if (!drone.target || !drone.velocity) continue;

    // Both IDLE and EXPLORING are orbital patrol states and should not apply
    // near-target braking intended for active task movement.
    const isOrbiting = drone.state === 'IDLE' || drone.state === 'EXPLORING';

    // STEERING
    if (drone.target) {
        steeringDesired.subVectors(drone.target, drone.position);
        const dist = steeringDesired.length();
        if (dist === 0) continue;
        steeringDesired.divideScalar(dist);

        // Prestige + upgrade modifiers
        const currentDataSpeed = maxDroneSpeed;

        if (!isOrbiting && dist < 5) {
          steeringDesired.multiplyScalar(currentDataSpeed * (dist / 5));
        } else {
          steeringDesired.multiplyScalar(currentDataSpeed);
        }

        steeringDelta.subVectors(steeringDesired, drone.velocity);
        steeringDelta.clampLength(0, 35 * delta);
        drone.velocity.add(steeringDelta);
    }
  }

  // SEPARATION Logic - Optimized with simple spatial grid
  const allDrones = ECS.with('isDrone', 'position', 'velocity').entities;

  // Use a simple spatial hash grid for neighbor search
  const grid = new Map<string, number[]>();
  const cellSize = 2.5;

  for (let i = 0; i < allDrones.length; i++) {
    const pos = allDrones[i].position;
    const gx = Math.floor(pos.x / cellSize);
    const gy = Math.floor(pos.y / cellSize);
    const gz = Math.floor(pos.z / cellSize);
    const key = `${gx},${gy},${gz}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(i);
  }

  for (let i = 0; i < allDrones.length; i++) {
    const d1 = allDrones[i];
    if (!d1.velocity) continue;

    const separation = new THREE.Vector3();
    let neighbors = 0;

    const pos = d1.position;
    const gx = Math.floor(pos.x / cellSize);
    const gy = Math.floor(pos.y / cellSize);
    const gz = Math.floor(pos.z / cellSize);

    // Check 27 cells (current + neighbors)
    for (let x = gx - 1; x <= gx + 1; x++) {
      for (let y = gy - 1; y <= gy + 1; y++) {
        for (let z = gz - 1; z <= gz + 1; z++) {
          const key = `${x},${y},${z}`;
          const cellIndices = grid.get(key);
          if (!cellIndices) continue;

          for (const j of cellIndices) {
            if (i === j) continue;
            const d2 = allDrones[j];

            const distSq = d1.position.distanceToSquared(d2.position);
            if (distSq > 0 && distSq < MAX_SEPARATION_DISTANCE_SQ) {
              separationPush.subVectors(d1.position, d2.position);
              separationPush.multiplyScalar(1 / distSq);
              separation.add(separationPush);
              neighbors++;
            }
          }
        }
      }
    }

    if (neighbors > 0) {
      separation.divideScalar(neighbors).multiplyScalar(20 * delta);
      d1.velocity.add(separation);
    }

    d1.velocity.clampLength(0, maxDroneSpeed);
    d1.position.add(d1.velocity.clone().multiplyScalar(delta));
  }
};
