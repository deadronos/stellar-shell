import { BlockType } from './types';
import * as THREE from 'three';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 128; // Virtual height for key generation

// Colors
export const BLOCK_COLORS: Record<number, string> = {
  [BlockType.ASTEROID_CORE]: '#a239ca', // Rare Purple Crystal
  [BlockType.ASTEROID_SURFACE]: '#5e626e', // Blue-tinted Grey Rock
  [BlockType.FRAME]: '#00d0ff', // Neon Blue
  [BlockType.PANEL]: '#111122', // Dark Solar
  [BlockType.HUB]: '#ff0055',
};

// block is transparent/wireframe?
export const IS_TRANSPARENT: Record<number, boolean> = {
  [BlockType.AIR]: true,
  [BlockType.FRAME]: true,
  [BlockType.PANEL]: false,
  [BlockType.ASTEROID_CORE]: false,
  [BlockType.ASTEROID_SURFACE]: false,
};

export const DRONE_COST = 50; // Matter
export const FRAME_COST = 5; // Matter
export const SHELL_COST = 2; // Rare Matter

// ThreeJS Materials reused
export const MATERIALS = {
  [BlockType.ASTEROID_CORE]: new THREE.MeshStandardMaterial({
    color: '#a239ca',
    roughness: 0.4,
    metalness: 0.5,
  }),
  [BlockType.FRAME]: new THREE.MeshBasicMaterial({
    color: '#00d0ff',
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  }),
  [BlockType.PANEL]: new THREE.MeshStandardMaterial({
    color: '#111',
    roughness: 0.2,
    metalness: 0.8,
    emissive: '#001133',
    emissiveIntensity: 0.2,
  }),
  [BlockType.SHELL]: new THREE.MeshStandardMaterial({
    color: '#ffd700', // Gold
    roughness: 0.1,
    metalness: 1.0,
    emissive: '#aa8800',
    emissiveIntensity: 0.4,
  }),
};
