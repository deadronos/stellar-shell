import * as THREE from 'three';
import { BlockType } from '../types';
import { CHUNK_SIZE } from '../constants';
import { ECS, Entity } from '../ecs/world';
import { VoxelMesher } from './voxel/VoxelMesher';
import { VoxelGenerator } from './voxel/VoxelGenerator';
import { VoxelQuery } from './voxel/VoxelQuery';

// bvx-kit imports
import { VoxelWorld, VoxelChunk8, MortonKey, VoxelIndex } from '@astrumforge/bvx-kit';

export class BvxEngine {
  // Actual Voxel Data Storage (4x4x4 chunks)
  // detailed bvx data
  private bvxWorld: VoxelWorld;

  // Cache of ECS Entities for each 16x16x16 Render Chunk
  // We use this to quickly mark chunks dirty without querying the ECS every time.
  private chunkEntities: Map<string, Entity> = new Map();

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
    return VoxelQuery.findBlueprints(this.chunkEntities.values(), this);
  }

  // Find valid mining targets (Asteroids) - Prefer exposed surface blocks
  public findMiningTargets(limit: number = 20): { x: number; y: number; z: number }[] {
    return VoxelQuery.findMiningTargets(this.chunkEntities.values(), this, limit);
  }

  // Procedural Generation
  public generateAsteroid(cx: number, cy: number, cz: number, radius: number) {
    VoxelGenerator.generateAsteroid(cx, cy, cz, radius, this);
  }

  // Meshing: Simple Face Culling
  // Now stateless: takes cx, cy, cz
  public generateChunkMesh(cx: number, cy: number, cz: number): {
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    indices: number[];
  } {
    return VoxelMesher.generateChunkMesh(cx, cy, cz, this);
  }
}
