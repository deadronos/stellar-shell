import * as THREE from 'three';
import { BlockType } from '../types';
import { CHUNK_SIZE, IS_TRANSPARENT, BLOCK_COLORS } from '../constants';
import { IVoxelSource } from '../services/voxel/types';

export class VoxelMesher {
  public static generateChunkMesh(
    cx: number,
    cy: number,
    cz: number,
    voxelSource: IVoxelSource
  ): {
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

          const block = voxelSource.getBlock(wx, wy, wz);
          if (block === BlockType.AIR) continue;

          // Check 6 neighbors
          for (const { dir, normal } of neighbors) {
            const neighborBlock = voxelSource.getBlock(wx + dir[0], wy + dir[1], wz + dir[2]);

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

  private static addFace(
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
