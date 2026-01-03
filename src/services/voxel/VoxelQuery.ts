import { BlockType } from '../../types';
import { CHUNK_SIZE } from '../../constants';
import { Entity } from '../../ecs/world';
import { IVoxelSource } from './types';

export class VoxelQuery {
  // Find all blueprints (Frames) for drones
  public static findBlueprints(
    chunkEntities: Iterable<Entity>,
    voxelSource: IVoxelSource
  ): { x: number; y: number; z: number }[] {
    const blueprints: { x: number; y: number; z: number }[] = [];

    // Iterating over Render Chunks (Entities)
    for (const entity of chunkEntities) {
        if (!entity.chunkPosition) continue;
        const { x: cx, y: cy, z: cz } = entity.chunkPosition;

         // Iterate all voxels in this logical chunk
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wy = cy * CHUNK_SIZE + y;
            const wz = cz * CHUNK_SIZE + z;

            if (voxelSource.getBlock(wx, wy, wz) === BlockType.FRAME) {
              blueprints.push({ x: wx, y: wy, z: wz });
            }
          }
        }
      }
    }

    return blueprints;
  }

  // Find valid mining targets (Asteroids) - Prefer exposed surface blocks
  public static findMiningTargets(
    chunkEntities: Iterable<Entity>,
    voxelSource: IVoxelSource,
    limit: number = 20
  ): { x: number; y: number; z: number }[] {
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
    for (const entity of chunkEntities) {
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

            const block = voxelSource.getBlock(wx, wy, wz);

            if (block === BlockType.ASTEROID_SURFACE || block === BlockType.ASTEROID_CORE) {
              // Check exposure
              let isExposed = false;
              for (const dir of directions) {
                const neighbor = voxelSource.getBlock(wx + dir[0], wy + dir[1], wz + dir[2]);
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
}
