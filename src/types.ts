export enum BlockType {
  AIR = 0,
  ASTEROID_CORE = 1,
  ASTEROID_SURFACE = 2,
  FRAME = 10,   // Blueprint stage
  PANEL = 20,   // Completed Dyson Panel
  HUB = 30      // Drone control hub
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ChunkKey {
  x: number;
  y: number;
  z: number;
}

export interface Drone {
  id: number;
  position: Vector3;
  target: Vector3 | null;
  state: 'IDLE' | 'MINING' | 'BUILDING' | 'RETURNING';
  carrying: BlockType | null;
}

export interface GameState {
  resources: {
    matter: number;
    energy: number;
    compute: number;
  };
  drones: {
    count: number;
    max: number;
    speed: number;
  };
  inventory: {
    blocks: number;
  };
}