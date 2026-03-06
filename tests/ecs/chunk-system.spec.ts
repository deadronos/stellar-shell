import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ChunkSystem } from '../../src/ecs/systems/ChunkSystem';
import { ECS } from '../../src/ecs/world';
import { BvxEngine } from '../../src/services/BvxEngine';
import { MesherWorkerPool, MeshResult } from '../../src/mesher/MesherWorkerPool';
import * as MesherWorkerPoolModule from '../../src/mesher/MesherWorkerPool';

type MockPool = Pick<MesherWorkerPool, 'generateMesh' | 'getQueueDepth' | 'getActiveWorkerCount'>;
type MockEngine = {
  getBlock: ReturnType<typeof vi.fn>;
  isChunkCompletedDyson: ReturnType<typeof vi.fn>;
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const flushAsyncWork = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const meshResult = (taskId: string, positions: number[]): MeshResult => ({
  taskId,
  positions: new Float32Array(positions),
  normals: new Float32Array(positions.map(() => 0)),
  colors: new Float32Array(positions.map(() => 1)),
  indices: positions.length > 0 ? [0, 1, 2] : [],
});

describe('ChunkSystem', () => {
  let mockPool: MockPool;

  beforeEach(() => {
    ECS.clear();

    mockPool = {
      generateMesh: vi.fn().mockResolvedValue(meshResult('default', [0, 0, 0, 1, 1, 1, 2, 2, 2])),
      getQueueDepth: vi.fn().mockReturnValue(0),
      getActiveWorkerCount: vi.fn().mockReturnValue(0),
    };

    vi.spyOn(MesherWorkerPoolModule, 'getMesherPool').mockReturnValue(
      mockPool as unknown as MesherWorkerPool,
    );
  });

  afterEach(() => {
    ECS.clear();
    vi.restoreAllMocks();
  });

  it('dispatches a mesh job and writes mesh data when the result is current', async () => {
    const mockEngine: MockEngine = {
      getBlock: vi.fn().mockReturnValue(0),
      isChunkCompletedDyson: vi.fn().mockReturnValue(false),
    };

    vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine as unknown as BvxEngine);

    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '0,0,0',
      chunkPosition: { x: 0, y: 0, z: 0 },
      needsUpdate: true,
      meshRevision: 1,
      position: new THREE.Vector3(0, 0, 0),
    });

    ChunkSystem();

    expect(mockPool.generateMesh).toHaveBeenCalledWith(0, 0, 0, mockEngine);
    expect(chunk.meshPending).toBe(true);
    expect(chunk.meshData).toBeUndefined();

    await flushAsyncWork();

    expect(chunk.meshData).toBeDefined();
    expect(chunk.meshPending).toBeUndefined();
  });

  it('adds completedDysonSection when the chunk is classified as completed', async () => {
    const mockEngine: MockEngine = {
      getBlock: vi.fn().mockReturnValue(0),
      isChunkCompletedDyson: vi.fn().mockReturnValue(true),
    };

    vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine as unknown as BvxEngine);

    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '1,0,0',
      chunkPosition: { x: 1, y: 0, z: 0 },
      needsUpdate: true,
      meshRevision: 1,
      position: new THREE.Vector3(16, 0, 0),
    });

    ChunkSystem();
    await flushAsyncWork();

    expect(mockEngine.isChunkCompletedDyson).toHaveBeenCalledWith(1, 0, 0);
    expect(chunk.completedDysonSection).toBe(true);
  });

  it('removes completedDysonSection when the chunk is no longer classified as completed', async () => {
    const mockEngine: MockEngine = {
      getBlock: vi.fn().mockReturnValue(0),
      isChunkCompletedDyson: vi.fn().mockReturnValue(false),
    };

    vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine as unknown as BvxEngine);

    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '2,0,0',
      chunkPosition: { x: 2, y: 0, z: 0 },
      needsUpdate: true,
      meshRevision: 1,
      completedDysonSection: true,
      position: new THREE.Vector3(32, 0, 0),
    });

    ChunkSystem();
    await flushAsyncWork();

    expect(mockEngine.isChunkCompletedDyson).toHaveBeenCalledWith(2, 0, 0);
    expect(chunk.completedDysonSection).toBeUndefined();
  });

  it('drops stale worker results when a newer chunk revision exists', async () => {
    const firstJob = deferred<MeshResult>();
    mockPool.generateMesh = vi.fn().mockReturnValue(firstJob.promise);

    const mockEngine: MockEngine = {
      getBlock: vi.fn().mockReturnValue(0),
      isChunkCompletedDyson: vi.fn().mockReturnValue(false),
    };

    vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine as unknown as BvxEngine);

    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '3,0,0',
      chunkPosition: { x: 3, y: 0, z: 0 },
      needsUpdate: true,
      meshRevision: 1,
      position: new THREE.Vector3(48, 0, 0),
    });

    ChunkSystem();
    expect(mockPool.generateMesh).toHaveBeenCalledTimes(1);
    expect(chunk.meshPending).toBe(true);

    chunk.meshRevision = 2;
    ECS.addComponent(chunk, 'needsUpdate', true);

    firstJob.resolve(meshResult('stale', [1, 1, 1, 2, 2, 2, 3, 3, 3]));
    await flushAsyncWork();

    expect(chunk.meshData).toBeUndefined();
    expect(chunk.meshPending).toBeUndefined();
    expect(chunk.needsUpdate).toBe(true);
  });

  it('does not overlap jobs for a dirty chunk and requeues after the stale result returns', async () => {
    const firstJob = deferred<MeshResult>();
    const secondJob = deferred<MeshResult>();
    mockPool.generateMesh = vi
      .fn()
      .mockReturnValueOnce(firstJob.promise)
      .mockReturnValueOnce(secondJob.promise);

    const mockEngine: MockEngine = {
      getBlock: vi.fn().mockReturnValue(0),
      isChunkCompletedDyson: vi.fn().mockReturnValue(false),
    };

    vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine as unknown as BvxEngine);

    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '4,0,0',
      chunkPosition: { x: 4, y: 0, z: 0 },
      needsUpdate: true,
      meshRevision: 1,
      position: new THREE.Vector3(64, 0, 0),
    });

    ChunkSystem();
    expect(mockPool.generateMesh).toHaveBeenCalledTimes(1);

    chunk.meshRevision = 2;
    ECS.addComponent(chunk, 'needsUpdate', true);

    ChunkSystem();
    expect(mockPool.generateMesh).toHaveBeenCalledTimes(1);

    firstJob.resolve(meshResult('rev-1', [1, 1, 1, 2, 2, 2, 3, 3, 3]));
    await flushAsyncWork();

    expect(chunk.needsUpdate).toBe(true);
    expect(chunk.meshData).toBeUndefined();

    ChunkSystem();
    expect(mockPool.generateMesh).toHaveBeenCalledTimes(2);

    secondJob.resolve(meshResult('rev-2', [4, 4, 4, 5, 5, 5, 6, 6, 6]));
    await flushAsyncWork();

    expect(chunk.meshPending).toBeUndefined();
    expect(Array.from(chunk.meshData?.positions ?? [])).toEqual([4, 4, 4, 5, 5, 5, 6, 6, 6]);
  });

  it('clears pending state and requeues when mesh generation rejects', async () => {
    const meshFailure = new Error('worker failed');
    mockPool.generateMesh = vi
      .fn()
      .mockRejectedValueOnce(meshFailure)
      .mockResolvedValueOnce(meshResult('retry', [7, 7, 7, 8, 8, 8, 9, 9, 9]));

    const mockEngine: MockEngine = {
      getBlock: vi.fn().mockReturnValue(0),
      isChunkCompletedDyson: vi.fn().mockReturnValue(false),
    };

    vi.spyOn(BvxEngine, 'getInstance').mockReturnValue(mockEngine as unknown as BvxEngine);

    const chunk = ECS.add({
      isChunk: true,
      chunkKey: '5,0,0',
      chunkPosition: { x: 5, y: 0, z: 0 },
      needsUpdate: true,
      meshRevision: 1,
      meshData: meshResult('existing', [1, 1, 1, 2, 2, 2, 3, 3, 3]),
      position: new THREE.Vector3(80, 0, 0),
    });

    ChunkSystem();
    expect(chunk.meshPending).toBe(true);

    await flushAsyncWork();

    expect(chunk.meshPending).toBeUndefined();
    expect(chunk.needsUpdate).toBe(true);
    expect(Array.from(chunk.meshData?.positions ?? [])).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3]);

    ChunkSystem();
    await flushAsyncWork();

    expect(mockPool.generateMesh).toHaveBeenCalledTimes(2);
    expect(Array.from(chunk.meshData?.positions ?? [])).toEqual([7, 7, 7, 8, 8, 8, 9, 9, 9]);
  });
});
