import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { BlockType } from '../types';
import { CHUNK_SIZE, IS_TRANSPARENT, BLOCK_COLORS } from '../constants';

// bvx-kit imports
import { VoxelWorld, VoxelChunk8, MortonKey, VoxelIndex } from '@astrumforge/bvx-kit';

// We keep this class as a "Render Chunk" controller to manage dirty state and THREE.js meshes.
// It no longer stores the actual voxel data; that lives in the bvx-kit VoxelWorld.
class RenderChunk {
  public dirty: boolean = true;
  public mesh: THREE.BufferGeometry | null = null;
  public position: { x: number; y: number; z: number };

  constructor(x: number, y: number, z: number) {
    this.position = { x, y, z };
  }
}

export class BvxEngine {
  // Map of RenderChunks (16x16x16) for the game's renderer
  public chunks: Map<string, RenderChunk> = new Map();

  // Actual Voxel Data Storage (4x4x4 chunks)
  private bvxWorld: VoxelWorld;

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
    this.bvxWorld = new VoxelWorld();

    // Generate initial world
    this.generateAsteroid(2, 0, 2, 20); // Generate an asteroid at chunk (2,0,2)
  }

  private getChunkKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  // World coordinate to Render Chunk coordinate (Stellar Shell Chunk Size = 16)
  public worldToChunk(
    x: number,
    y: number,
    z: number,
  ): { cx: number; cy: number; cz: number; lx: number; ly: number; lz: number } {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { cx, cy, cz, lx, ly, lz };
  }

  public setBlock(wx: number, wy: number, wz: number, type: BlockType) {
    // 1. Update bvx-kit VoxelWorld
    // bvx-kit uses 4x4x4 chunks.
    const bvxChunkSize = 4;
    const bcx = Math.floor(wx / bvxChunkSize);
    const bcy = Math.floor(wy / bvxChunkSize);
    const bcz = Math.floor(wz / bvxChunkSize);

    const bKey = MortonKey.from(bcx, bcy, bcz);
    let bChunk = this.bvxWorld.get(bKey);

    if (!bChunk) {
      if (type === BlockType.AIR) return; // Optimization: Don't create chunks for air
      bChunk = new VoxelChunk8(bKey);
      this.bvxWorld.insert(bChunk);
    }

    // Calculate local index within 4x4x4 chunk
    const blx = ((wx % bvxChunkSize) + bvxChunkSize) % bvxChunkSize;
    const bly = ((wy % bvxChunkSize) + bvxChunkSize) % bvxChunkSize;
    const blz = ((wz % bvxChunkSize) + bvxChunkSize) % bvxChunkSize;

    const vIndex = VoxelIndex.from(blx, bly, blz);

    // Set Metadata (Block Type)
    // Cast strict BlockType enum to number for setMetaData
    (bChunk as VoxelChunk8).setMetaData(vIndex, type);

    // Set Geometry Bit (Solid vs Air) used for internal bvx operations
    if (type !== BlockType.AIR) {
      bChunk.setBitVoxel(vIndex);
    } else {
      bChunk.unsetBitVoxel(vIndex);
    }

    // 2. Mark Render Chunk as dirty
    const { cx, cy, cz } = this.worldToChunk(wx, wy, wz);
    const renderKey = this.getChunkKey(cx, cy, cz);

    let renderChunk = this.chunks.get(renderKey);
    if (!renderChunk) {
      // Create render chunk wrapper if it doesn't exist (e.g. first block in this area)
      renderChunk = new RenderChunk(cx, cy, cz);
      this.chunks.set(renderKey, renderChunk);
    }
    renderChunk.dirty = true;

    // Mark neighbors dirty if on boundary
    // ... (simplified: omit for now, but critical for proper meshing across boundaries)
    this.markNeighborsDirty(wx, wy, wz, cx, cy, cz);
  }

  private markNeighborsDirty(
    wx: number,
    wy: number,
    wz: number,
    cx: number,
    cy: number,
    cz: number,
  ) {
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    if (lx === 0) this.ensureDirty(cx - 1, cy, cz);
    if (lx === CHUNK_SIZE - 1) this.ensureDirty(cx + 1, cy, cz);
    if (ly === 0) this.ensureDirty(cx, cy - 1, cz);
    if (ly === CHUNK_SIZE - 1) this.ensureDirty(cx, cy + 1, cz);
    if (lz === 0) this.ensureDirty(cx, cy, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.ensureDirty(cx, cy, cz + 1);
  }

  private ensureDirty(cx: number, cy: number, cz: number) {
    const key = this.getChunkKey(cx, cy, cz);
    const chunk = this.chunks.get(key);
    if (chunk) chunk.dirty = true;
  }

  public getBlock(wx: number, wy: number, wz: number): BlockType {
    const bvxChunkSize = 4;
    const bcx = Math.floor(wx / bvxChunkSize);
    const bcy = Math.floor(wy / bvxChunkSize);
    const bcz = Math.floor(wz / bvxChunkSize);

    const bKey = MortonKey.from(bcx, bcy, bcz);
    const bChunk = this.bvxWorld.get(bKey);

    if (!bChunk) return BlockType.AIR;

    const blx = ((wx % bvxChunkSize) + bvxChunkSize) % bvxChunkSize;
    const bly = ((wy % bvxChunkSize) + bvxChunkSize) % bvxChunkSize;
    const blz = ((wz % bvxChunkSize) + bvxChunkSize) % bvxChunkSize;

    const vIndex = VoxelIndex.from(blx, bly, blz);
    return (bChunk as VoxelChunk8).getMetaData(vIndex) as BlockType;
  }

  // Find all blueprints (Frames) for drones
  public findBlueprints(): { x: number; y: number; z: number }[] {
    const blueprints: { x: number; y: number; z: number }[] = [];

    // Iterating over Render Chunks is safer for now as they represent the "active" area we care about in the game logic
    this.chunks.forEach((chunk) => {
      // Iterate all voxels in this logical chunk
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = chunk.position.x * CHUNK_SIZE + x;
            const wy = chunk.position.y * CHUNK_SIZE + y;
            const wz = chunk.position.z * CHUNK_SIZE + z;

            if (this.getBlock(wx, wy, wz) === BlockType.FRAME) {
              blueprints.push({ x: wx, y: wy, z: wz });
            }
          }
        }
      }
    });

    return blueprints;
  }

  // Find valid mining targets (Asteroids) - Prefer exposed surface blocks
  public findMiningTargets(limit: number = 20): { x: number; y: number; z: number }[] {
    const targets: { x: number; y: number; z: number }[] = [];
    const directions = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];

    // Scan Render Chunks
    for (const chunk of this.chunks.values()) {
      if (targets.length >= limit) break;

      // Optimize: Skip checking air-only chunks if we had a flag (RenderChunk doesn't track this yet)

      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            if (targets.length >= limit) break;

            const wx = chunk.position.x * CHUNK_SIZE + x;
            const wy = chunk.position.y * CHUNK_SIZE + y;
            const wz = chunk.position.z * CHUNK_SIZE + z;

            const block = this.getBlock(wx, wy, wz);

            if (block === BlockType.ASTEROID_SURFACE || block === BlockType.ASTEROID_CORE) {
              // Check exposure
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
      }
    }
    return targets;
  }

  // Procedural Generation
  public generateAsteroid(cx: number, cy: number, cz: number, radius: number) {
    const center = new THREE.Vector3(
      cx * CHUNK_SIZE + CHUNK_SIZE / 2,
      cy * CHUNK_SIZE + CHUNK_SIZE / 2,
      cz * CHUNK_SIZE + CHUNK_SIZE / 2,
    );

    // Scan a larger area of chunks to ensure the asteroid fits
    const range = Math.ceil(radius / CHUNK_SIZE) + 1;

    for (let x = cx - range; x <= cx + range; x++) {
      for (let y = cy - range; y <= cy + range; y++) {
        for (let z = cz - range; z <= cz + range; z++) {
          // We need to touch every voxel in this range potentially
          for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            for (let ly = 0; ly < CHUNK_SIZE; ly++) {
              for (let lz = 0; lz < CHUNK_SIZE; lz++) {
                const wx = x * CHUNK_SIZE + lx;
                const wy = y * CHUNK_SIZE + ly;
                const wz = z * CHUNK_SIZE + lz;

                const dist = center.distanceTo(new THREE.Vector3(wx, wy, wz));
                const noise = this.noise3D(wx * 0.1, wy * 0.1, wz * 0.1);

                if (dist < radius + noise * 5) {
                  this.setBlock(
                    wx,
                    wy,
                    wz,
                    dist < radius * 0.5 ? BlockType.ASTEROID_CORE : BlockType.ASTEROID_SURFACE,
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  // Meshing: Simple Face Culling
  public generateChunkMesh(chunk: RenderChunk): {
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    indices: number[];
  } {
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
          const wx = chunk.position.x * CHUNK_SIZE + x;
          const wy = chunk.position.y * CHUNK_SIZE + y;
          const wz = chunk.position.z * CHUNK_SIZE + z;

          const block = this.getBlock(wx, wy, wz);
          if (block === BlockType.AIR) continue;

          // Check 6 neighbors
          for (const { dir, normal } of neighbors) {
            const neighborBlock = this.getBlock(wx + dir[0], wy + dir[1], wz + dir[2]);

            // Visibility check
            if (
              IS_TRANSPARENT[neighborBlock] &&
              !(IS_TRANSPARENT[block] && neighborBlock === block)
            ) {
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
      indices: indices,
    };
  }

  private addFace(
    pos: number[],
    norm: number[],
    col: number[],
    ind: number[],
    x: number,
    y: number,
    z: number,
    normal: number[],
    type: BlockType,
  ) {
    const i = pos.length / 3;

    // Determine face vertices based on normal
    // 0.5 offset for centering
    const dx = normal[0] * 0.5;
    const dy = normal[1] * 0.5;
    const dz = normal[2] * 0.5;

    // Basis vectors for the face
    let ux = 0,
      uy = 0,
      uz = 0;
    let vx = 0,
      vy = 0,
      vz = 0;

    if (Math.abs(normal[0]) > 0.9) {
      ux = 0;
      uy = 1;
      uz = 0;
      vx = 0;
      vy = 0;
      vz = 1;
    } else if (Math.abs(normal[1]) > 0.9) {
      ux = 1;
      uy = 0;
      uz = 0;
      vx = 0;
      vy = 0;
      vz = 1;
    } else {
      ux = 1;
      uy = 0;
      uz = 0;
      vx = 0;
      vy = 1;
      vz = 0;
    }

    // 4 corners
    const c1 = [
      x + 0.5 + dx - ux * 0.5 - vx * 0.5,
      y + 0.5 + dy - uy * 0.5 - vy * 0.5,
      z + 0.5 + dz - uz * 0.5 - vz * 0.5,
    ];
    const c2 = [
      x + 0.5 + dx + ux * 0.5 - vx * 0.5,
      y + 0.5 + dy + uy * 0.5 - vy * 0.5,
      z + 0.5 + dz + uz * 0.5 - vz * 0.5,
    ];
    const c3 = [
      x + 0.5 + dx + ux * 0.5 + vx * 0.5,
      y + 0.5 + dy + uy * 0.5 + vy * 0.5,
      z + 0.5 + dz + uz * 0.5 + vz * 0.5,
    ];
    const c4 = [
      x + 0.5 + dx - ux * 0.5 + vx * 0.5,
      y + 0.5 + dy - uy * 0.5 + vy * 0.5,
      z + 0.5 + dz - uz * 0.5 + vz * 0.5,
    ];

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
