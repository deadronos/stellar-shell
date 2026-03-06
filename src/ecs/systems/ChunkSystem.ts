import { ECS, Entity } from '../world';
import { BvxEngine } from '../../services/BvxEngine';
import { getMesherPool } from '../../mesher/MesherWorkerPool';

// Track the currently in-flight revision for each chunk key.
const pendingJobs: Map<string, number> = new Map();

/**
 * Dispatch a mesh generation job to the worker pool.
 */
function dispatchMeshJob(entity: Entity, cx: number, cy: number, cz: number) {
    const engine = BvxEngine.getInstance();
    const pool = getMesherPool();
    const chunkKey = entity.chunkKey as string;
    const revision = entity.meshRevision ?? 0;

    // Mark as pending so the system never overlaps jobs for the same chunk.
    ECS.removeComponent(entity, 'needsUpdate');
    ECS.addComponent(entity, 'meshPending', true);
    entity.pendingMeshRevision = revision;

    // Dispatch to worker pool
    pool.generateMesh(cx, cy, cz, engine).then((meshResult) => {
        // Clear pending state first so a newer dirty revision can be re-dispatched next frame.
        ECS.removeComponent(entity, 'meshPending');
        entity.pendingMeshRevision = undefined;

        const latestRevision = entity.meshRevision ?? 0;
        if (latestRevision !== revision) {
            if (!entity.needsUpdate) {
                ECS.addComponent(entity, 'needsUpdate', true);
            }
            pendingJobs.delete(chunkKey);
            return;
        }

        // Only the newest revision is allowed to update render state.
        if (entity.meshData) ECS.removeComponent(entity, 'meshData');
        ECS.addComponent(entity, 'meshData', meshResult);

        // Classify the chunk: mark as completedDysonSection when applicable.
        // Worst-case scans the whole chunk, but frontier chunks usually early-exit
        // on the first non-completed block type.
        const isCompleted = engine.isChunkCompletedDyson(cx, cy, cz);
        if (isCompleted && !entity.completedDysonSection) {
            ECS.addComponent(entity, 'completedDysonSection', true);
        } else if (!isCompleted && entity.completedDysonSection) {
            ECS.removeComponent(entity, 'completedDysonSection');
        }
        
        // Clean up tracking
        pendingJobs.delete(chunkKey);
    });

    pendingJobs.set(chunkKey, revision);
}

/**
 * ChunkSystem: Handles chunk mesh generation using worker pool.
 * 
 * Flow:
 * 1. Find chunks marked as 'needsUpdate'
 * 2. Dispatch mesh job to worker pool
 * 3. Mark entity as 'meshPending'
 * 4. When worker returns, only apply the result if it still matches the latest revision
 */
export const ChunkSystem = () => {
    // 1. Dispatch new mesh jobs for dirty chunks
    const dirtyChunks = ECS.with('isChunk', 'chunkPosition', 'needsUpdate');

    for (const entity of [...dirtyChunks.entities]) {
        if (entity.needsUpdate && !entity.meshPending) {
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
