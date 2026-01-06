import * as THREE from 'three';
import { ECS } from '../world';
import { ParticleEvents } from '../../services/ParticleEvents';

// Colors for different states
const COLOR_MINING = new THREE.Color(0xff0000); // Red
const COLOR_BUILDING = new THREE.Color(0x00aaff); // Light Blue
const COLOR_RETURNING = new THREE.Color(0x00ff00); // Green
const COLOR_IDLE = new THREE.Color(0xffaa00); // Orange/Gold

// Reuse objects
const _velocity = new THREE.Vector3();

// Throttle emission
let timeSinceLastEmission = 0;
const EMISSION_RATE = 0.05; // 20 times per second

export const TrailSystem = (delta: number) => {
  timeSinceLastEmission += delta;
  
  if (timeSinceLastEmission < EMISSION_RATE) return;
  
  const drones = ECS.with('isDrone', 'position', 'velocity');
  
  for (const drone of drones) {
      // Only emit if moving fast enough
      const speedSq = drone.velocity?.lengthSq() ?? 0;
      if (speedSq < 0.5) continue;

      // Determine color based on state
      let color = COLOR_IDLE;
      if (drone.state === 'MOVING_TO_MINE') color = COLOR_MINING;
      else if (drone.state === 'MOVING_TO_BUILD') color = COLOR_BUILDING;
      else if (drone.state === 'RETURNING_RESOURCE') color = COLOR_RETURNING;

      // Trail velocity should be opposite to drone movement (exhaust)
      // plus some small random spread for realism
      _velocity.copy(drone.velocity!).multiplyScalar(-0.2); 
      _velocity.x += (Math.random() - 0.5) * 0.5;
      _velocity.y += (Math.random() - 0.5) * 0.5;
      _velocity.z += (Math.random() - 0.5) * 0.5;

      // Emit particle
      ParticleEvents.emit(
          drone.position, // Start at drone position
          color,
          1,
          {
              velocity: _velocity,
              life: 0.8 // Short life for trails
          }
      );
  }
  
  // Reset timer (subtract, don't set to 0, to carry over extra time)
  timeSinceLastEmission %= EMISSION_RATE;
};
