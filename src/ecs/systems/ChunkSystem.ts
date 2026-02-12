import { ECS, Entity } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { getMesherPool, MeshResult } from '../../mesher/MesherWorkerPool';

// Track pending mesh jobs by chunk key
const pendingJobs: Map<string, { entity: Entity; resolve: (mesh: MeshResult) => void }> = new Map();

/**
 * Dispatch a mesh generation job to the worker pool.
 */
function dispatchMeshJob(entity: Entity, cx: number, cy: number, cz: number) {
    const engine = BvxEngine.getInstance();
    const pool = getMesherPool();
    const chunkKey = entity.chunkKey as string;

    // Mark as pending (to avoid re-dispatching)
    ECS.removeComponent(entity, 'needsUpdate');
    ECS.addComponent(entity, 'meshPending', true);

    // Dispatch to worker pool
    pool.generateMesh(cx, cy, cz, engine).then((meshResult) => {
        // Update entity with mesh data
        if (entity.meshData) ECS.removeComponent(entity, 'meshData');
        ECS.addComponent(entity, 'meshData', meshResult);
        
        // Clear pending flag
        ECS.removeComponent(entity, 'meshPending');
        
        // Clean up tracking
        pendingJobs.delete(chunkKey);
    });

    pendingJobs.set(chunkKey, { entity, resolve: () => {} });
}

/**
 * ChunkSystem: Handles chunk mesh generation using worker pool.
 * 
 * Flow:
 * 1. Find chunks marked as 'needsUpdate'
 * 2. Dispatch mesh job to worker pool
 * 3. Mark entity as 'meshPending'
 * 4. When worker returns, update 'meshData' component
 */
export const ChunkSystem = () => {
    // 1. Dispatch new mesh jobs for dirty chunks
    const dirtyChunks = ECS.with('isChunk', 'chunkPosition', 'needsUpdate');

    for (const entity of [...dirtyChunks.entities]) {
        if (entity.needsUpdate) {
            const { x, y, z } = entity.chunkPosition;
            dispatchMeshJob(entity, x, y, z);
        }
    }

    // 2. Process any pending jobs (handled via promise callbacks above)
    // The system mainly triggers dispatches; actual mesh updates happen async
};

/**
 * Get count of pending mesh jobs (for debugging/monitoring).
 */
export function getPendingMeshJobCount(): number {
    return pendingJobs.size;
}
