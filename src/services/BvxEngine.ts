import * as THREE from 'three';
import { BlockType, DysonProgressMetrics } from '../types';
import { CHUNK_SIZE, PANEL_ENERGY_RATE, SHELL_ENERGY_RATE } from '../constants';
import { ECS, Entity } from '../ecs/world';
import { VoxelMesher } from '../mesher/VoxelMesher';
import { VoxelGenerator } from './voxel/VoxelGenerator';
import { VoxelQuery } from './voxel/VoxelQuery';

// bvx-kit imports
import { VoxelWorld, VoxelChunk8, MortonKey, VoxelIndex } from '@astrumforge/bvx-kit';
import { BlueprintManager } from './BlueprintManager';

const NEIGHBOR_DIRS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const MINE_TYPES = new Set<BlockType>([
  BlockType.ASTEROID_SURFACE,
  BlockType.ASTEROID_CORE,
  BlockType.RARE_ORE,
]);

export class BvxEngine {
  private static readonly DYSON_BLUEPRINT_RADIUS = 24;
  private static readonly DYSON_BLUEPRINT_NODE_COUNT = 64;
  // Actual Voxel Data Storage (4x4x4 chunks)
  // detailed bvx data
  private bvxWorld: VoxelWorld;

  // Cache of ECS Entities for each 16x16x16 Render Chunk
  // We use this to quickly mark chunks dirty without querying the ECS every time.
  private chunkEntities: Map<string, Entity> = new Map();

  // Persistent counters for Dyson-related blocks to avoid full world scans
  private counters = {
    blueprintFrames: 0,
    frames: 0,
    panels: 0,
    shells: 0,
  };

  // Incremental spatial indexes (issue #66)
  // Exposed blocks (ASTEROID_SURFACE, ASTEROID_CORE, RARE_ORE) with at least one AIR or FRAME neighbor
  private exposedMines = new Set<string>();
  // All FRAME blocks eligible for PANEL upgrade
  private buildableFrames = new Set<string>();
  // All PANEL blocks eligible for SHELL upgrade
  private buildablePanels = new Set<string>();

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

    // NOTE: World generation is intentionally NOT performed in the constructor.
    // SystemRunner (or tests) own service lifetimes and call generateAsteroid /
    // generateDysonBlueprintSkeleton explicitly. This keeps construction side-effect
    // free and avoids rebuilding the world on HMR/dev reload.
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

  private updateVoxelCounter(type: BlockType, delta: number) {
    if (type === BlockType.BLUEPRINT_FRAME) this.counters.blueprintFrames += delta;
    else if (type === BlockType.FRAME) this.counters.frames += delta;
    else if (type === BlockType.PANEL) this.counters.panels += delta;
    else if (type === BlockType.SHELL) this.counters.shells += delta;
  }

  private scanDysonCounts(): {
    blueprintFrames: number;
    frames: number;
    panels: number;
    shells: number;
  } {
    let blueprintFrames = 0;
    let frames = 0;
    let panels = 0;
    let shells = 0;

    for (const entity of this.chunkEntities.values()) {
      if (!entity.chunkPosition) continue;
      const { x: cx, y: cy, z: cz } = entity.chunkPosition;
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
          for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            const block = this.getBlock(
              cx * CHUNK_SIZE + lx,
              cy * CHUNK_SIZE + ly,
              cz * CHUNK_SIZE + lz,
            );
            if (block === BlockType.BLUEPRINT_FRAME) blueprintFrames++;
            else if (block === BlockType.FRAME) frames++;
            else if (block === BlockType.PANEL) panels++;
            else if (block === BlockType.SHELL) shells++;
          }
        }
      }
    }

    return { blueprintFrames, frames, panels, shells };
  }

  /**
   * Rebuild the cached Dyson counters from the current voxel world snapshot.
   */
  public refreshDysonCountersFromWorld(): void {
    this.counters = this.scanDysonCounts();
  }

  // ── Incremental spatial index helpers ──────────────────────────────────────

  private posKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private isMineType(block: BlockType): boolean {
    return MINE_TYPES.has(block);
  }

  /** Check whether a block at (x,y,z) has at least one AIR or FRAME neighbor. */
  private isExposed(x: number, y: number, z: number): boolean {
    for (const [dx, dy, dz] of NEIGHBOR_DIRS) {
      const neighbor = this.getBlock(x + dx, y + dy, z + dz);
      if (neighbor === BlockType.AIR || neighbor === BlockType.FRAME) return true;
    }
    return false;
  }

  /**
   * Evaluate whether the block at (x,y,z) should appear in exposedMines.
   * Call after any block change that could affect this position's exposure.
   */
  private evaluateBlockForMining(x: number, y: number, z: number): void {
    const key = this.posKey(x, y, z);
    this.exposedMines.delete(key);

    const block = this.getBlock(x, y, z);
    if (!this.isMineType(block)) return;

    if (this.isExposed(x, y, z)) {
      this.exposedMines.add(key);
    }
  }

  /**
   * Evaluate whether the block at (x,y,z) should appear in buildableFrames
   * or buildablePanels. Building eligibility depends only on the block type
   * itself, not on neighbors.
   */
  private evaluateBlockForBuilding(x: number, y: number, z: number): void {
    const key = this.posKey(x, y, z);
    this.buildableFrames.delete(key);
    this.buildablePanels.delete(key);

    const block = this.getBlock(x, y, z);
    if (block === BlockType.FRAME) {
      this.buildableFrames.add(key);
    } else if (block === BlockType.PANEL) {
      this.buildablePanels.add(key);
    }
  }

  /**
   * After a block change at (wx,wy,wz), re-evaluate the changed position
   * and all 6 neighbors to keep spatial indexes consistent.
   */
  private updateSpatialIndexes(wx: number, wy: number, wz: number): void {
    // Re-evaluate the changed position
    this.evaluateBlockForMining(wx, wy, wz);
    this.evaluateBlockForBuilding(wx, wy, wz);

    // Re-evaluate neighbors (their exposure may have changed)
    for (const [dx, dy, dz] of NEIGHBOR_DIRS) {
      this.evaluateBlockForMining(wx + dx, wy + dy, wz + dz);
      // Building sets only depend on the block itself, not on neighbors,
      // so we only re-evaluate building for the changed position above.
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

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
    const oldType = (bChunk as VoxelChunk8).getMetaData(vIndex) as BlockType;

    if (oldType === type) return;

    // Set Metadata (Block Type)
    // Cast strict BlockType enum to number for setMetaData
    (bChunk as VoxelChunk8).setMetaData(vIndex, type);

    // Update Counters
    this.updateVoxelCounter(oldType, -1);
    this.updateVoxelCounter(type, 1);

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
        meshRevision: 1,
        position: new THREE.Vector3(cx * CHUNK_SIZE, cy * CHUNK_SIZE, cz * CHUNK_SIZE), // World position for convenient access
      });
      this.chunkEntities.set(renderKey, entity);
    } else {
      this.markChunkDirty(entity);
    }

    // Mark neighbors dirty if on boundary
    this.markNeighborsDirty(wx, wy, wz, cx, cy, cz);

    // 3. Update incremental spatial indexes
    this.updateSpatialIndexes(wx, wy, wz);
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
      this.markChunkDirty(entity);
    }
  }

  private markChunkDirty(entity: Entity) {
    entity.meshRevision = (entity.meshRevision ?? 0) + 1;

    // Toggle the component to ensure Miniplex query subscriptions observe the dirty state.
    if (entity.needsUpdate) {
      ECS.removeComponent(entity, 'needsUpdate');
    }
    ECS.addComponent(entity, 'needsUpdate', true);
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

  // Find blocks of specific type — queries incremental spatial indexes instead of full world scan.
  public findBlocksByType(
    type: BlockType,
    limit: number = 20,
  ): { x: number; y: number; z: number }[] {
    const blocks: { x: number; y: number; z: number }[] = [];

    let source: Set<string>;
    if (type === BlockType.FRAME) source = this.buildableFrames;
    else if (type === BlockType.PANEL) source = this.buildablePanels;
    else return []; // Unhandled types have no index

    for (const key of source) {
      if (blocks.length >= limit) break;
      const [x, y, z] = key.split(',').map(Number);
      blocks.push({ x, y, z });
    }
    return blocks;
  }

  // Compute the energy generation rate from actual voxel world state (single source of truth).
  // Use cached counters for O(1) computation.
  public computeEnergyRate(): number {
    return this.computeEnergyRateFromCounts(this.counters);
  }

  private computeEnergyRateFromCounts(counts: { panels: number; shells: number }): number {
    return counts.panels * PANEL_ENERGY_RATE + counts.shells * SHELL_ENERGY_RATE;
  }

  private toDysonProgressMetrics(counts: {
    blueprintFrames: number;
    frames: number;
    panels: number;
    shells: number;
  }): DysonProgressMetrics {
    const prestigeReady = counts.shells >= 16;
    const milestones =
      Number(counts.frames > 0) +
      Number(counts.panels > 0) +
      Number(counts.shells > 0) +
      Number(prestigeReady);

    return {
      blueprintFrames: counts.blueprintFrames,
      frames: counts.frames,
      panels: counts.panels,
      shells: counts.shells,
      milestones,
      prestigeReady,
    };
  }

  // Compute explicit Dyson progression metrics from world state.
  public computeDysonProgress(): DysonProgressMetrics {
    return this.toDysonProgressMetrics(this.counters);
  }

  // Single-pass world scan for events that need both energy and Dyson progression updates.
  public computeWorldDerivedMetrics(): {
    energyRate: number;
    dysonProgress: DysonProgressMetrics;
  } {
    return {
      energyRate: this.computeEnergyRateFromCounts(this.counters),
      dysonProgress: this.toDysonProgressMetrics(this.counters),
    };
  }

  // Reset World (Prestige)
  public resetWorld(blueprints: BlueprintManager): void {
    // Re-instantiate the VoxelWorld to clear all data
    this.bvxWorld = new VoxelWorld();

    // Clear ECS chunk entities
    const chunkEntities = ECS.with('isChunk');
    for (const chunk of [...chunkEntities.entities]) {
      ECS.remove(chunk);
    }

    // Clear local cache map
    this.chunkEntities.clear();

    // Reset counters
    this.counters = {
      blueprintFrames: 0,
      frames: 0,
      panels: 0,
      shells: 0,
    };

    // Reset incremental spatial indexes
    this.exposedMines.clear();
    this.buildableFrames.clear();
    this.buildablePanels.clear();

    // Clear blueprint overlays so stale markers don't persist in the new system
    blueprints.reset();
    this.refreshDysonCountersFromWorld();
  }

  // Find valid mining targets (Asteroids) — queries the incremental exposedMines index.
  public findMiningTargets(limit: number = 20): { x: number; y: number; z: number }[] {
    const targets: { x: number; y: number; z: number }[] = [];
    for (const key of this.exposedMines) {
      if (targets.length >= limit) break;
      const [x, y, z] = key.split(',').map(Number);
      targets.push({ x, y, z });
    }
    return targets;
  }

  // Procedural Generation
  public generateAsteroid(cx: number, cy: number, cz: number, radius: number, seed: number = 0) {
    VoxelGenerator.generateAsteroid(cx, cy, cz, radius, this, seed);
  }

  /**
   * Generates blueprint-frame construction nodes in a spherical pattern around the star at (0,0,0).
   */
  public generateDysonBlueprintSkeleton(
    blueprints: BlueprintManager,
    radius: number = BvxEngine.DYSON_BLUEPRINT_RADIUS,
    nodeCount: number = BvxEngine.DYSON_BLUEPRINT_NODE_COUNT,
  ) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const seen = new Set<string>();

    for (let i = 0; i < nodeCount; i++) {
      const sphereSample = i + 0.5;
      const normalizedY = 1 - (2 * sphereSample) / nodeCount;
      const radial = Math.sqrt(1 - normalizedY * normalizedY);
      const theta = goldenAngle * i;

      const x = Math.round(Math.cos(theta) * radial * radius);
      const worldY = Math.round(normalizedY * radius);
      const z = Math.round(Math.sin(theta) * radial * radius);
      const key = `${x},${worldY},${z}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (this.getBlock(x, worldY, z) !== BlockType.AIR) continue;
      this.setBlock(x, worldY, z, BlockType.BLUEPRINT_FRAME);
      blueprints.addBlueprint({ x, y: worldY, z });
    }
    this.refreshDysonCountersFromWorld();
  }

  // Meshing: Simple Face Culling
  // Now stateless: takes cx, cy, cz
  public generateChunkMesh(
    cx: number,
    cy: number,
    cz: number,
  ): {
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    indices: number[];
  } {
    return VoxelMesher.generateChunkMesh(cx, cy, cz, this);
  }

  /** Returns true when every solid voxel in the chunk is PANEL or SHELL. */
  public isChunkCompletedDyson(cx: number, cy: number, cz: number): boolean {
    return VoxelQuery.isChunkCompletedDyson(cx, cy, cz, this);
  }
}
