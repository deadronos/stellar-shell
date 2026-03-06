import { describe, it, expect, afterEach } from 'vitest';
import { MesherWorkerPool } from '../../src/mesher/MesherWorkerPool';
import { BlockType } from '../../src/types';
import { CHUNK_SIZE } from '../../src/constants';

type WorkerGlobal = typeof globalThis & { Worker?: typeof Worker };
type WorkerMessage = { taskId: string; voxelData?: Record<string, BlockType> };

/** Build a fresh MockWorker class and a list that tracks every created instance. */
function makeMockWorkerClass() {
    const instances: MockWorker[] = [];

    class MockWorker {
        onmessage: ((e: MessageEvent) => void) | null = null;
        onerror: ((e: ErrorEvent) => void) | null = null;
        onmessageerror = null;
        received: WorkerMessage[] = [];

        constructor(_url: unknown, _opts?: unknown) {
            instances.push(this);
        }

        postMessage(data: WorkerMessage) {
            this.received.push(data);
        }

        terminate() {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() { return true; }

        /** Simulate the worker completing a job with the given taskId. */
        simulateComplete(taskId: string) {
            const mesh = {
                taskId,
                positions: new Float32Array(0),
                normals: new Float32Array(0),
                colors: new Float32Array(0),
                indices: [],
            };
            this.onmessage?.({ data: { taskId, mesh } } as MessageEvent);
        }
    }

    return { MockWorker, instances };
}

const mockSource = { getBlock: () => BlockType.AIR };
const originalWorker = (global as WorkerGlobal).Worker;

afterEach(() => {
    const workerGlobal = global as WorkerGlobal;
    if (originalWorker) {
        workerGlobal.Worker = originalWorker;
        return;
    }

    delete workerGlobal.Worker;
});

describe('MesherWorkerPool – worker lifecycle', () => {
    it('worker is returned to available pool after job completes', () => {
        const { MockWorker, instances } = makeMockWorkerClass();
        global.Worker = MockWorker as unknown as typeof Worker;

        const pool = new MesherWorkerPool(1);
        const w = instances[0];

        expect(pool.getActiveWorkerCount()).toBe(0);

        pool.generateMesh(0, 0, 0, mockSource);
        expect(pool.getActiveWorkerCount()).toBe(1);

        w.simulateComplete(w.received[0].taskId);

        expect(pool.getActiveWorkerCount()).toBe(0);
        pool.dispose();
    });

    it('workers are reusable across multiple sequential jobs', async () => {
        const { MockWorker, instances } = makeMockWorkerClass();
        global.Worker = MockWorker as unknown as typeof Worker;

        const pool = new MesherWorkerPool(1);
        const w = instances[0];

        // First job
        const p1 = pool.generateMesh(0, 0, 0, mockSource);
        w.simulateComplete(w.received[0].taskId);
        await p1;

        expect(pool.getActiveWorkerCount()).toBe(0);

        // Second job – the same worker must accept it
        const p2 = pool.generateMesh(1, 0, 0, mockSource);
        expect(pool.getActiveWorkerCount()).toBe(1);
        expect(w.received.length).toBe(2);

        w.simulateComplete(w.received[1].taskId);
        await p2;

        expect(pool.getActiveWorkerCount()).toBe(0);
        pool.dispose();
    });

    it('queue depth decreases as workers complete queued jobs', () => {
        const { MockWorker, instances } = makeMockWorkerClass();
        global.Worker = MockWorker as unknown as typeof Worker;

        const pool = new MesherWorkerPool(1);
        const w = instances[0];

        // Dispatch 3 jobs to a single-worker pool (1 active + 2 queued)
        pool.generateMesh(0, 0, 0, mockSource);
        pool.generateMesh(1, 0, 0, mockSource);
        pool.generateMesh(2, 0, 0, mockSource);

        expect(pool.getQueueDepth()).toBe(2);

        // Complete first job → second job dispatched from queue
        w.simulateComplete(w.received[0].taskId);
        expect(pool.getQueueDepth()).toBe(1);

        // Complete second job → third job dispatched from queue
        w.simulateComplete(w.received[1].taskId);
        expect(pool.getQueueDepth()).toBe(0);

        // Complete third job → worker idle
        w.simulateComplete(w.received[2].taskId);
        expect(pool.getActiveWorkerCount()).toBe(0);
        pool.dispose();
    });
});

describe('MesherWorkerPool – neighbor halo sampling', () => {
    it('includes 1-voxel halo from neighboring chunks in voxelData sent to worker', () => {
        const { MockWorker, instances } = makeMockWorkerClass();
        global.Worker = MockWorker as unknown as typeof Worker;

        // Solid blocks fill chunk (0,0,0) and the first column of chunk (1,0,0).
        // When meshing chunk (0,0,0), the halo must include x = CHUNK_SIZE so the
        // boundary face between the two chunks can be culled.
        const neighbor = CHUNK_SIZE; // first x of chunk (1,0,0)
        const source = {
            getBlock: (x: number, y: number, z: number) => {
                if (x >= 0 && x < CHUNK_SIZE && y >= 0 && y < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
                    return BlockType.ASTEROID_SURFACE;
                }
                if (x === neighbor && y >= 0 && y < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
                    return BlockType.ASTEROID_SURFACE;
                }
                return BlockType.AIR;
            }
        };

        const pool = new MesherWorkerPool(1);
        pool.generateMesh(0, 0, 0, source);

        const job = instances[0].received[0];

        // Halo voxels one step past the positive-x face of chunk (0,0,0)
        // must be present so the worker can cull that boundary face.
        const haloKey = `${neighbor},0,0`;
        expect(job.voxelData?.[haloKey]).toBe(BlockType.ASTEROID_SURFACE);

        pool.dispose();
    });

    it('all 6 boundary halo faces are included in voxelData sent to worker', () => {
        const { MockWorker, instances } = makeMockWorkerClass();
        global.Worker = MockWorker as unknown as typeof Worker;

        // Solid blocks fill the full halo region around chunk (0,0,0).
        const source = {
            getBlock: (x: number, y: number, z: number) => {
                if (x >= -1 && x <= CHUNK_SIZE && y >= -1 && y <= CHUNK_SIZE && z >= -1 && z <= CHUNK_SIZE) {
                    return BlockType.ASTEROID_SURFACE;
                }
                return BlockType.AIR;
            }
        };

        const pool = new MesherWorkerPool(1);
        pool.generateMesh(0, 0, 0, source);

        const job = instances[0].received[0];

        // All 6 halo faces must be populated so the worker can cull every boundary face.
        expect(job.voxelData?.[`${CHUNK_SIZE},0,0`]).toBe(BlockType.ASTEROID_SURFACE); // +x halo
        expect(job.voxelData?.[`-1,0,0`]).toBe(BlockType.ASTEROID_SURFACE); // -x halo
        expect(job.voxelData?.[`0,${CHUNK_SIZE},0`]).toBe(BlockType.ASTEROID_SURFACE); // +y halo
        expect(job.voxelData?.[`0,-1,0`]).toBe(BlockType.ASTEROID_SURFACE); // -y halo
        expect(job.voxelData?.[`0,0,${CHUNK_SIZE}`]).toBe(BlockType.ASTEROID_SURFACE); // +z halo
        expect(job.voxelData?.[`0,0,-1`]).toBe(BlockType.ASTEROID_SURFACE); // -z halo

        pool.dispose();
    });
});
