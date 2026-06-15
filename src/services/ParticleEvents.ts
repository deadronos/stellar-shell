import * as THREE from 'three';

export interface ParticleOptions {
  velocity?: THREE.Vector3;
  life?: number;
}

export type ParticleCallback = (
  position: THREE.Vector3,
  color: THREE.Color,
  count?: number,
  options?: ParticleOptions,
) => void;

export class ParticleEventsService {
  private listeners: ParticleCallback[] = [];

  public subscribe(callback: ParticleCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public emit(
    position: THREE.Vector3,
    color: THREE.Color,
    count: number = 1,
    options?: ParticleOptions,
  ) {
    this.listeners.forEach((cb) => cb(position, color, count, options));
  }
}

/**
 * Legacy global singleton for non-system consumers that have not yet been migrated
 * to dependency injection. New code should prefer receiving a `ParticleEventsService`
 * instance through `RuntimeContext`.
 */
export const ParticleEvents = new ParticleEventsService();
