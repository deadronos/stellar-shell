import { BvxEngine } from '../services/BvxEngine';
import { BlueprintManager } from '../services/BlueprintManager';
import { ParticleEventsService } from '../services/ParticleEvents';
import { MesherWorkerPool } from '../mesher/MesherWorkerPool';

/**
 * Runtime services required by ECS systems.
 *
 * Systems receive this value object instead of importing global singletons,
 * making them testable in isolation and removing side effects from service
 * construction (especially important for HMR safety).
 */
export interface RuntimeContext {
  engine: BvxEngine;
  blueprints: BlueprintManager;
  particles: ParticleEventsService;
  mesherPool: MesherWorkerPool;
}

export interface CreateRuntimeContextOptions {
  /**
   * Number of worker threads for the mesher pool. Defaults to the browser's
   * hardware concurrency in production. Tests should pass 0 to avoid instantiating
   * Web Workers in Node.
   */
  mesherWorkerCount?: number;
}

/**
 * Create a fresh, isolated runtime context. Tests should call this to avoid
 * relying on global singleton state or defensive teardown.
 */
export function createRuntimeContext(options?: CreateRuntimeContextOptions): RuntimeContext {
  return {
    engine: new BvxEngine(),
    blueprints: new BlueprintManager(),
    particles: new ParticleEventsService(),
    mesherPool: new MesherWorkerPool(options?.mesherWorkerCount),
  };
}

/**
 * Reset the voxel world, blueprints, and ECS chunk state for a prestige/system jump.
 * Auto-blueprint traversal must be reset separately by the caller.
 */
export function resetRuntimeContext(ctx: RuntimeContext): void {
  ctx.engine.resetWorld(ctx.blueprints);
}
