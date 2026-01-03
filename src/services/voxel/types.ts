import { BlockType } from '../../types';

export interface IVoxelSource {
  getBlock(x: number, y: number, z: number): BlockType;
}

export interface IVoxelModifier {
  setBlock(x: number, y: number, z: number, type: BlockType): void;
}
