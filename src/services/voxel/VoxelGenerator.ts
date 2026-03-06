import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { BlockType } from '../../types';
import { CHUNK_SIZE } from '../../constants';
import { IVoxelModifier } from './types';
import { createLcgRandom } from '../../utils/lcg';

export interface SystemParams {
  /** Asteroid radius in voxels [16–24]. */
  radius: number;
  /** Simplex noise scale for asteroid surface shape [0.08–0.12]. */
  noiseScale: number;
  /** Threshold above which a voxel becomes rare ore [0.55–0.70]. */
  rareThreshold: number;
}

export class VoxelGenerator {
  /** Deterministically derive per-system generation parameters from a seed. */
  public static deriveSystemParams(seed: number): SystemParams {
    const s = seed >>> 0; // treat as unsigned 32-bit
    return {
      radius: 16 + ((s >> 8) % 9),                        // [16 – 24]
      noiseScale: 0.08 + (s % 5) * 0.01,                  // [0.08 – 0.12]
      rareThreshold: 0.55 + ((s >> 4) % 4) * 0.05,        // [0.55 – 0.70]
    };
  }

  public static generateAsteroid(
    cx: number,
    cy: number,
    cz: number,
    radius: number,
    voxelModifier: IVoxelModifier,
    seed: number = 0
  ) {
    // Derive per-system generation parameters from seed.
    const { noiseScale, rareThreshold } = VoxelGenerator.deriveSystemParams(seed);
    const seededRandom = createLcgRandom(seed);
    const noise3D = createNoise3D(seededRandom);
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
                const noise = noise3D(wx * noiseScale, wy * noiseScale, wz * noiseScale);

                if (dist < radius + noise * 5) {
                  let blockType = BlockType.ASTEROID_SURFACE;
                  const isCore = dist < radius * 0.5;
                  
                  if (isCore) {
                      blockType = BlockType.ASTEROID_CORE;
                  }
                  
                  // Rare Ore Veins (High frequency noise)
                  const rareNoise = noise3D(
                    wx * noiseScale * 3,
                    wy * noiseScale * 3,
                    wz * noiseScale * 3,
                  );
                  if (rareNoise > rareThreshold) {
                      blockType = BlockType.RARE_ORE;
                  }

                  voxelModifier.setBlock(
                    wx,
                    wy,
                    wz,
                    blockType,
                  );
                }
              }
            }
          }
        }
      }
    }
  }
}
