import { World } from 'miniplex';
import * as THREE from 'three';
import { BlockType } from '../types';

export type Entity = {
  // Core
  id?: number;
  position: THREE.Vector3;
  velocity?: THREE.Vector3;

  // Components
  isDrone?: boolean;
  
  // Drone State
  target?: THREE.Vector3; // If present, entity is moving towards this
  state?: 'IDLE' | 'MOVING_TO_BUILD' | 'MOVING_TO_MINE' | 'RETURNING_RESOURCE';
  targetBlock?: { x: number; y: number; z: number };
  carryingType?: BlockType | null;

  // Visuals
  color?: THREE.Color;
  
  // Particle State
  isParticle?: boolean;
  life?: number;
  active?: boolean;
};

// Create a typed world
export const ECS = new World<Entity>();
