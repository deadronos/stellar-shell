import { BlockType } from '../../types';
import { CHUNK_SIZE } from '../../constants';
import { IVoxelSource } from './types';

/** Block types that count as "completed" Dyson-sphere construction. */
const COMPLETED_DYSON_TYPES = new Set<BlockType>([BlockType.PANEL, BlockType.SHELL]);

/**
 * Stateless voxel queries that operate on a single chunk or simple source.
 *
 * NOTE: World-scanning methods (findMiningTargets, findBlocksByType) have been
 * replaced by incremental spatial indexes in BvxEngine (see issue #66).
 */
export class VoxelQuery {
  /**
   * Returns true when every solid (non-AIR) voxel in the given render chunk
   * belongs to the set of completed Dyson-sphere block types (PANEL / SHELL).
   * A chunk with no solid voxels is NOT considered completed.
   */
  public static isChunkCompletedDyson(
    cx: number,
    cy: number,
    cz: number,
    voxelSource: IVoxelSource,
  ): boolean {
    let solidCount = 0;
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const block = voxelSource.getBlock(
            cx * CHUNK_SIZE + x,
            cy * CHUNK_SIZE + y,
            cz * CHUNK_SIZE + z,
          );
          if (block === BlockType.AIR) continue;
          if (!COMPLETED_DYSON_TYPES.has(block)) return false;
          solidCount++;
        }
      }
    }
    return solidCount > 0;
  }
}
