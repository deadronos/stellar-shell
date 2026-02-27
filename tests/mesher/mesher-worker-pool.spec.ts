import { describe, it, expect, afterEach } from 'vitest';
import { MesherWorkerPool } from '../../src/mesher/MesherWorkerPool';
import { BlockType } from '../../src/types';

type WorkerGlobal = typeof globalThis & { Worker?: typeof Worker };

/** Build a fresh MockWorker class and a list that tracks every created instance. */
function makeMockWorkerClass() {
    const instances: MockWorker[] = [];

    class MockWorker {
        onmessage: ((e: MessageEvent) => void) | null = null;
        onerror: ((e: ErrorEvent) => void) | null = null;
        onmessageerror = null;
        received: { taskId: string }[] = [];

        constructor(_url: unknown, _opts?: unknown) {
            instances.push(this);
        }

        postMessage(data: { taskId: string }) {
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
