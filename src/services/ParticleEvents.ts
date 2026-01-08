import * as THREE from 'three';

interface ParticleOptions {
  velocity?: THREE.Vector3;
  life?: number;
}

type ParticleCallback = (position: THREE.Vector3, color: THREE.Color, count?: number, options?: ParticleOptions) => void;

class ParticleEventsService {
  private listeners: ParticleCallback[] = [];

  public subscribe(callback: ParticleCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public emit(position: THREE.Vector3, color: THREE.Color, count: number = 1, options?: ParticleOptions) {
    this.listeners.forEach((cb) => cb(position, color, count, options));
  }
}

export const ParticleEvents = new ParticleEventsService();
