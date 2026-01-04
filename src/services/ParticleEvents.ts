import * as THREE from 'three';

type ParticleCallback = (position: THREE.Vector3, color: THREE.Color, count?: number) => void;

class ParticleEventsService {
  private listeners: ParticleCallback[] = [];

  public subscribe(callback: ParticleCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public emit(position: THREE.Vector3, color: THREE.Color, count: number = 1) {
    this.listeners.forEach((cb) => cb(position, color, count));
  }
}

export const ParticleEvents = new ParticleEventsService();
