import { VoxelMesher } from './VoxelMesher';
import { IVoxelSource } from '../services/voxel/types';
import { BlockType } from '../types';


self.onmessage = (e: MessageEvent) => {
    const { taskId, cx, cy, cz, voxelData } = e.data;

    // Reconstruct a VoxelSource from the passed data.
    const source: IVoxelSource = {
        getBlock: (x: number, y: number, z: number) => {
            // Look up in the passed voxelData object
            const key = `${x},${y},${z}`;
            return voxelData[key] || BlockType.AIR;
        }
    };

    const mesh = VoxelMesher.generateChunkMesh(cx, cy, cz, source);

    // Transfer buffers back for performance
    const transfer = [
        mesh.positions.buffer,
        mesh.normals.buffer,
        mesh.colors.buffer
    ];

    self.postMessage({
        taskId,
        mesh
    }, { transfer: transfer as Transferable[] });
};
