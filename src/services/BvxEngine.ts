import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { BlockType } from '../types';
import { CHUNK_SIZE, IS_TRANSPARENT, BLOCK_COLORS } from '../constants';
import { ECS, Entity } from '../ecs/world';

// bvx-kit imports
import { VoxelWorld, VoxelChunk8, MortonKey, VoxelIndex } from '@astrumforge/bvx-kit';

export class BvxEngine {
  // Actual Voxel Data Storage (4x4x4 chunks)
  // detailed bvx data
  private bvxWorld: VoxelWorld;

  // Cache of ECS Entities for each 16x16x16 Render Chunk
  // We use this to quickly mark chunks dirty without querying the ECS every time.
  private chunkEntities: Map<string, Entity> = new Map();

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

    // Hydrate local cache from existing ECS state (prevents duplicates on HMR/Singleton reload)
    const existingChunks = ECS.with('isChunk', 'chunkKey');
    for (const entity of existingChunks) {
        if (typeof entity.chunkKey === 'string') {
            this.chunkEntities.set(entity.chunkKey, entity);
        }
    }

    // Generate initial world
    // Note: If we really wanted to be HMR safe, we should probably check if chunks exist before generating?
    // But for now, regenerating the voxel data into the new BvxWorld instance is necessary anyway since that data is lost.
    // Reusing the ECS entities means we just update the existing render chunks.
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

    // 2. Mark Render Chunk (ECS Entity) as dirty
    const { cx, cy, cz } = this.worldToChunk(wx, wy, wz);
    const renderKey = this.getChunkKey(cx, cy, cz);

    let entity = this.chunkEntities.get(renderKey);
    if (!entity) {
      // Create new Chunk Entity in ECS
      entity = ECS.add({
        isChunk: true,
        chunkKey: renderKey,
        chunkPosition: { x: cx, y: cy, z: cz },
        needsUpdate: true,
        position: new THREE.Vector3(cx * CHUNK_SIZE, cy * CHUNK_SIZE, cz * CHUNK_SIZE), // World position for convenient access
      });
      this.chunkEntities.set(renderKey, entity);
    } else {
      // Mark existing entity as dirty using addComponent to notify Miniplex
      ECS.addComponent(entity, 'needsUpdate', true);
    }

    // Mark neighbors dirty if on boundary
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
    const entity = this.chunkEntities.get(key);
    if (entity) {
      ECS.addComponent(entity, 'needsUpdate', true);
    }
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

    // Iterating over Render Chunks (Entities)
    for (const entity of this.chunkEntities.values()) {
        if (!entity.chunkPosition) continue;
        const { x: cx, y: cy, z: cz } = entity.chunkPosition;

         // Iterate all voxels in this logical chunk
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wy = cy * CHUNK_SIZE + y;
            const wz = cz * CHUNK_SIZE + z;

            if (this.getBlock(wx, wy, wz) === BlockType.FRAME) {
              blueprints.push({ x: wx, y: wy, z: wz });
            }
          }
        }
      }
    }

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

    // Scan Chunk Entities
    for (const entity of this.chunkEntities.values()) {
      if (targets.length >= limit) break;
        if (!entity.chunkPosition) continue;
        const { x: cx, y: cy, z: cz } = entity.chunkPosition;

      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            if (targets.length >= limit) break;

            const wx = cx * CHUNK_SIZE + x;
            const wy = cy * CHUNK_SIZE + y;
            const wz = cz * CHUNK_SIZE + z;

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
  // Now stateless: takes cx, cy, cz
  public generateChunkMesh(cx: number, cy: number, cz: number): {
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
          const wx = cx * CHUNK_SIZE + x;
          const wy = cy * CHUNK_SIZE + y;
          const wz = cz * CHUNK_SIZE + z;

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
