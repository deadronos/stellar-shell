import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { BlockType, ChunkKey } from '../types';
import { CHUNK_SIZE, IS_TRANSPARENT, BLOCK_COLORS } from '../constants';

// A simple sparse voxel octree-like structure (implemented as a Map of Chunks for simplicity)
class Chunk {
  public data: Uint8Array;
  public dirty: boolean = true;
  public mesh: THREE.BufferGeometry | null = null;
  public position: { x: number, y: number, z: number };

  constructor(x: number, y: number, z: number) {
    this.position = { x, y, z };
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
  }

  getIndex(x: number, y: number, z: number): number {
    return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
  }

  setBlock(x: number, y: number, z: number, type: BlockType) {
    const idx = this.getIndex(x, y, z);
    if (this.data[idx] !== type) {
      this.data[idx] = type;
      this.dirty = true;
    }
  }

  getBlock(x: number, y: number, z: number): BlockType {
    return this.data[this.getIndex(x, y, z)];
  }
}

export class BvxEngine {
  public chunks: Map<string, Chunk> = new Map();
  private noise3D = createNoise3D();
  
  // Singleton pattern for the engine core
  private static instance: BvxEngine;
  public static getInstance(): BvxEngine {
    if (!BvxEngine.instance) {
      BvxEngine.instance = new BvxEngine();
    }
    return BvxEngine.instance;
  }

  constructor() {
    // Generate initial world
    this.generateAsteroid(2, 0, 2, 20); // Generate an asteroid at chunk (2,0,2)
  }

  private getChunkKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  // World coordinate to Chunk coordinate
  public worldToChunk(x: number, y: number, z: number): { cx: number, cy: number, cz: number, lx: number, ly: number, lz: number } {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { cx, cy, cz, lx, ly, lz };
  }

  public setBlock(wx: number, wy: number, wz: number, type: BlockType) {
    const { cx, cy, cz, lx, ly, lz } = this.worldToChunk(wx, wy, wz);
    const key = this.getChunkKey(cx, cy, cz);
    
    let chunk = this.chunks.get(key);
    if (!chunk) {
      if (type === BlockType.AIR) return; // Don't create chunks for air
      chunk = new Chunk(cx, cy, cz);
      this.chunks.set(key, chunk);
    }
    chunk.setBlock(lx, ly, lz, type);
  }

  public getBlock(wx: number, wy: number, wz: number): BlockType {
    const { cx, cy, cz, lx, ly, lz } = this.worldToChunk(wx, wy, wz);
    const chunk = this.chunks.get(this.getChunkKey(cx, cy, cz));
    return chunk ? chunk.getBlock(lx, ly, lz) : BlockType.AIR;
  }

  // Find all blueprints (Frames) for drones
  public findBlueprints(): {x: number, y: number, z: number}[] {
    const blueprints: {x: number, y: number, z: number}[] = [];
    // This is a naive scan. In a real engine, we'd maintain a list of active blueprints.
    this.chunks.forEach(chunk => {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const block = chunk.getBlock(x,y,z);
            if (block === BlockType.FRAME) {
              blueprints.push({
                x: chunk.position.x * CHUNK_SIZE + x,
                y: chunk.position.y * CHUNK_SIZE + y,
                z: chunk.position.z * CHUNK_SIZE + z
              });
            }
          }
        }
      }
    });
    return blueprints;
  }

  // Find valid mining targets (Asteroids) - Prefer exposed surface blocks
  public findMiningTargets(limit: number = 20): {x: number, y: number, z: number}[] {
    const targets: {x: number, y: number, z: number}[] = [];
    const directions = [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1]
    ];

    // Shuffle chunks iterator slightly or just iterate? 
    // Standard iteration is fine, but we'll stop early.
    for (const chunk of this.chunks.values()) {
        if (targets.length >= limit) break;
        
        for (let i = 0; i < chunk.data.length; i++) {
            if (targets.length >= limit) break;

            const block = chunk.data[i];
            if (block === BlockType.ASTEROID_SURFACE || block === BlockType.ASTEROID_CORE) {
                // Recover coordinates from index
                const cz = Math.floor(i / (CHUNK_SIZE * CHUNK_SIZE));
                const rem = i % (CHUNK_SIZE * CHUNK_SIZE);
                const cy = Math.floor(rem / CHUNK_SIZE);
                const cx = rem % CHUNK_SIZE;
                
                const wx = chunk.position.x * CHUNK_SIZE + cx;
                const wy = chunk.position.y * CHUNK_SIZE + cy;
                const wz = chunk.position.z * CHUNK_SIZE + cz;

                // Check exposure: At least one neighbor must be AIR
                let isExposed = false;
                for (const dir of directions) {
                    const neighbor = this.getBlock(wx + dir[0], wy + dir[1], wz + dir[2]);
                    if (neighbor === BlockType.AIR || neighbor === BlockType.FRAME) {
                        isExposed = true;
                        break;
                    }
                }

                if (isExposed) {
                    targets.push({ x: wx, y: wy, z: wz });
                }
            }
        }
    }
    return targets;
  }

  // Procedural Generation
  public generateAsteroid(cx: number, cy: number, cz: number, radius: number) {
    const center = new THREE.Vector3(cx * CHUNK_SIZE + CHUNK_SIZE/2, cy * CHUNK_SIZE + CHUNK_SIZE/2, cz * CHUNK_SIZE + CHUNK_SIZE/2);
    
    // Scan a larger area of chunks to ensure the asteroid fits
    const range = Math.ceil(radius / CHUNK_SIZE) + 1;
    
    for(let x = cx - range; x <= cx + range; x++) {
      for(let y = cy - range; y <= cy + range; y++) {
        for(let z = cz - range; z <= cz + range; z++) {
            const chunk = new Chunk(x, y, z);
            let hasSolid = false;
            
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                for (let ly = 0; ly < CHUNK_SIZE; ly++) {
                    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
                        const wx = x * CHUNK_SIZE + lx;
                        const wy = y * CHUNK_SIZE + ly;
                        const wz = z * CHUNK_SIZE + lz;
                        
                        const dist = center.distanceTo(new THREE.Vector3(wx, wy, wz));
                        const noise = this.noise3D(wx * 0.1, wy * 0.1, wz * 0.1);
                        
                        if (dist < radius + noise * 5) {
                            chunk.setBlock(lx, ly, lz, dist < radius * 0.5 ? BlockType.ASTEROID_CORE : BlockType.ASTEROID_SURFACE);
                            hasSolid = true;
                        }
                    }
                }
            }
            if(hasSolid) {
                this.chunks.set(this.getChunkKey(x,y,z), chunk);
            }
        }
      }
    }
  }

  // Meshing: Simple Face Culling
  public generateChunkMesh(chunk: Chunk): { positions: Float32Array, normals: Float32Array, colors: Float32Array, indices: number[] } {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    
    // Neighbor offsets
    const neighbors = [
      { dir: [1, 0, 0], normal: [1, 0, 0] },
      { dir: [-1, 0, 0], normal: [-1, 0, 0] },
      { dir: [0, 1, 0], normal: [0, 1, 0] },
      { dir: [0, -1, 0], normal: [0, -1, 0] },
      { dir: [0, 0, 1], normal: [0, 0, 1] },
      { dir: [0, 0, -1], normal: [0, 0, -1] },
    ];

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = chunk.getBlock(x, y, z);
          if (block === BlockType.AIR) continue;

          // Check 6 neighbors
          for (const { dir, normal } of neighbors) {
            const nx = x + dir[0];
            const ny = y + dir[1];
            const nz = z + dir[2];
            
            let neighborBlock = BlockType.AIR;

            // Internal neighbor
            if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
              neighborBlock = chunk.getBlock(nx, ny, nz);
            } else {
              // External neighbor (check other chunks)
              // For simplicity in this demo, we treat boundaries as transparent if chunk missing
              // Ideally we check the neighbor chunk
              const wx = chunk.position.x * CHUNK_SIZE + nx;
              const wy = chunk.position.y * CHUNK_SIZE + ny;
              const wz = chunk.position.z * CHUNK_SIZE + nz;
              neighborBlock = this.getBlock(wx, wy, wz);
            }

            if (IS_TRANSPARENT[neighborBlock] && !(IS_TRANSPARENT[block] && neighborBlock === block)) {
              // Add Face
              this.addFace(positions, normals, colors, indices, x, y, z, normal, block);
            }
          }
        }
      }
    }
    
    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      colors: new Float32Array(colors),
      indices: indices
    };
  }

  private addFace(pos: number[], norm: number[], col: number[], ind: number[], x: number, y: number, z: number, normal: number[], type: BlockType) {
    const i = pos.length / 3;
    
    // Determine face vertices based on normal
    // 0.5 offset for centering
    const dx = normal[0] * 0.5;
    const dy = normal[1] * 0.5;
    const dz = normal[2] * 0.5;

    // Basis vectors for the face
    let ux = 0, uy = 0, uz = 0;
    let vx = 0, vy = 0, vz = 0;

    if (Math.abs(normal[0]) > 0.9) { ux = 0; uy = 1; uz = 0; vx = 0; vy = 0; vz = 1; }
    else if (Math.abs(normal[1]) > 0.9) { ux = 1; uy = 0; uz = 0; vx = 0; vy = 0; vz = 1; }
    else { ux = 1; uy = 0; uz = 0; vx = 0; vy = 1; vz = 0; }

    // 4 corners
    const c1 = [x + 0.5 + dx - ux*0.5 - vx*0.5, y + 0.5 + dy - uy*0.5 - vy*0.5, z + 0.5 + dz - uz*0.5 - vz*0.5];
    const c2 = [x + 0.5 + dx + ux*0.5 - vx*0.5, y + 0.5 + dy + uy*0.5 - vy*0.5, z + 0.5 + dz + uz*0.5 - vz*0.5];
    const c3 = [x + 0.5 + dx + ux*0.5 + vx*0.5, y + 0.5 + dy + uy*0.5 + vy*0.5, z + 0.5 + dz + uz*0.5 + vz*0.5];
    const c4 = [x + 0.5 + dx - ux*0.5 + vx*0.5, y + 0.5 + dy - uy*0.5 + vy*0.5, z + 0.5 + dz - uz*0.5 + vz*0.5];

    pos.push(...c1, ...c2, ...c3, ...c4);
    norm.push(...normal, ...normal, ...normal, ...normal);

    // Color
    const colorHex = BLOCK_COLORS[type] || '#ff00ff';
    const c = new THREE.Color(colorHex);
    
    // Add visual noise to surface/core blocks for "texture" without actual textures
    if (type === BlockType.ASTEROID_SURFACE || type === BlockType.ASTEROID_CORE) {
        // Deterministic pseudo-random noise based on world position to avoid flickering
        const noiseVal = (Math.sin(x * 12.9898 + y * 78.233 + z * 53.53) * 43758.5453) % 1;
        const variance = (noiseVal - 0.5) * 0.15; // +/- 7% brightness
        c.r = Math.max(0, Math.min(1, c.r + variance));
        c.g = Math.max(0, Math.min(1, c.g + variance));
        c.b = Math.max(0, Math.min(1, c.b + variance));
    }

    col.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);

    // Indices (2 triangles)
    ind.push(i, i + 1, i + 2);
    ind.push(i, i + 2, i + 3);
  }
}