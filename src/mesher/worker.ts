import { VoxelMesher } from './VoxelMesher';
import { IVoxelSource } from '../services/voxel/types';
import { BlockType } from '../types';


self.onmessage = (e: MessageEvent) => {
    const { taskId, cx, cy, cz, voxelData } = e.data;

    // We need to reconstruct a VoxelSource from the passed data.
    // This is the hard part of off-threading: sharing the world data.
    // Ideally we pass a SharedArrayBuffer or a transferable buffer of the relevant chunk + neighbors.

    // For this refactor, we are establishing the boundary.
    // I will mock the source for now or assume `voxelData` contains what we need.

    const source: IVoxelSource = {
        getBlock: (x, y, z) => {
            // Very naive lookup in the passed object
            // key = "x,y,z"
            const key = `${x},${y},${z}`;
            return voxelData[key] || BlockType.AIR;
        }
    };

    const mesh = VoxelMesher.generateChunkMesh(cx, cy, cz, source);

    // Transfer buffers back
    const transfer = [
        mesh.positions.buffer,
        mesh.normals.buffer,
        mesh.colors.buffer
        // indices is array, not typed array yet in VoxelMesher return?
        // Wait, VoxelMesher returns `indices: number[]`.
    ];

    self.postMessage({
        taskId,
        mesh
    }, { transfer: transfer as Transferable[] });
};
