import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { BlockType } from '../../types';
import { CHUNK_SIZE } from '../../constants';
import { IVoxelModifier } from './types';

export class VoxelGenerator {
  private static noise3D = createNoise3D();

  public static generateAsteroid(
    cx: number,
    cy: number,
    cz: number,
    radius: number,
    voxelModifier: IVoxelModifier
  ) {
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
                  voxelModifier.setBlock(
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
}
