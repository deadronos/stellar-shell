import { VoxelMesher } from './VoxelMesher';
import { IVoxelSource } from '../services/voxel/types';
import { BlockType } from '../types';
import { CHUNK_SIZE } from '../constants';

export interface MeshJob {
    taskId: string;
    cx: number;
    cy: number;
    cz: number;
    voxelData: Record<string, BlockType>;
}

export interface MeshResult {
    taskId: string;
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    indices: number[];
}

export type MeshResultCallback = (result: MeshResult) => void;

/**
 * Worker pool for generating voxel meshes off the main thread.
 * Uses a simple queue with backpressure when all workers are busy.
 */
export class MesherWorkerPool {
    private workers: Worker[] = [];
    private availableWorkers: Worker[] = [];
    private jobQueue: MeshJob[] = [];
    private pendingJobs: Map<string, { job: MeshJob; resolve: MeshResultCallback }> = new Map();
    private workerCount: number;
    private taskIdCounter = 0;

    constructor(workerCount: number = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4) {
        this.workerCount = workerCount;
        this.initWorkers();
    }

    private initWorkers() {
        for (let i = 0; i < this.workerCount; i++) {
            const worker = new Worker(new URL('./worker.ts', import.meta.url), {
                type: 'module'
            });
            
            worker.onmessage = (e: MessageEvent) => {
                this.handleWorkerMessage(worker, e.data);
            };

            worker.onerror = (error) => {
                console.error('MesherWorker error:', error);
            };

            this.workers.push(worker);
            this.availableWorkers.push(worker);
        }
    }

    private handleWorkerMessage(worker: Worker, data: { taskId: string; mesh: MeshResult }) {
        const pending = this.pendingJobs.get(data.taskId);
        if (pending) {
            pending.resolve(data.mesh);
            this.pendingJobs.delete(data.taskId);
        }

        // Return worker to pool or dispatch next queued job
        this.processQueue(worker);
    }

    private processQueue(worker: Worker) {
        const job = this.jobQueue.shift();
        if (!job) {
            // No jobs waiting, return worker to available pool
            this.availableWorkers.push(worker);
            return;
        }

        // Send next queued job to the freed worker
        worker.postMessage(job);
    }

    /**
     * Queue a mesh generation job.
     * Returns a promise that resolves with the mesh data.
     */
    public generateMesh(
        cx: number,
        cy: number,
        cz: number,
        voxelSource: IVoxelSource
    ): Promise<MeshResult> {
        const taskId = `mesh-${++this.taskIdCounter}-${cx}-${cy}-${cz}`;

        // Extract voxel data for this chunk + 1-voxel neighbor halo on all sides.
        // The halo is required so the worker can correctly cull faces at chunk boundaries
        // (otherwise neighbor lookups outside the chunk always return AIR).
        const voxelData: Record<string, BlockType> = {};
        const startX = cx * CHUNK_SIZE;
        const startY = cy * CHUNK_SIZE;
        const startZ = cz * CHUNK_SIZE;

        for (let x = startX - 1; x <= startX + CHUNK_SIZE; x++) {
            for (let y = startY - 1; y <= startY + CHUNK_SIZE; y++) {
                for (let z = startZ - 1; z <= startZ + CHUNK_SIZE; z++) {
                    const block = voxelSource.getBlock(x, y, z);
                    if (block !== BlockType.AIR) {
                        voxelData[`${x},${y},${z}`] = block;
                    }
                }
            }
        }

        const job: MeshJob = {
            taskId,
            cx,
            cy,
            cz,
            voxelData
        };

        // Check if we have an available worker
        const worker = this.availableWorkers.pop();
        
        if (worker) {
            // Send directly to worker
            worker.postMessage(job);
        } else {
            // Queue the job (backpressure)
            this.jobQueue.push(job);
        }

        // Return promise that resolves when worker responds
        return new Promise((resolve) => {
            this.pendingJobs.set(taskId, { job, resolve });
        });
    }

    /**
     * Generate mesh synchronously (for fallback or testing).
     */
    public generateMeshSync(
        cx: number,
        cy: number,
        cz: number,
        voxelSource: IVoxelSource
    ): MeshResult {
        const mesh = VoxelMesher.generateChunkMesh(cx, cy, cz, voxelSource);
        return {
            taskId: 'sync',
            ...mesh
        };
    }

    /**
     * Get queue depth for monitoring.
     */
    public getQueueDepth(): number {
        return this.jobQueue.length;
    }

    /**
     * Get number of active workers.
     */
    public getActiveWorkerCount(): number {
        return this.workerCount - this.availableWorkers.length;
    }

    /**
     * Terminate all workers.
     */
    public dispose() {
        for (const worker of this.workers) {
            worker.terminate();
        }
        this.workers = [];
        this.availableWorkers = [];
        this.jobQueue = [];
        this.pendingJobs.clear();
    }
}

// Singleton instance
let poolInstance: MesherWorkerPool | null = null;

export function getMesherPool(): MesherWorkerPool {
    if (!poolInstance) {
        poolInstance = new MesherWorkerPool();
    }
    return poolInstance;
}

export function disposeMesherPool() {
    if (poolInstance) {
        poolInstance.dispose();
        poolInstance = null;
    }
}
