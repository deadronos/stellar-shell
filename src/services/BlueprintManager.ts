import { Vector3 } from '../types';

export class BlueprintManager {
  private static instance: BlueprintManager;
  private blueprints: Set<string> = new Set();
  private listeners: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): BlueprintManager {
    if (!BlueprintManager.instance) {
      BlueprintManager.instance = new BlueprintManager();
    }
    return BlueprintManager.instance;
  }

  public addBlueprint(pos: Vector3) {
    const key = `${pos.x},${pos.y},${pos.z}`;
    if (!this.blueprints.has(key)) {
      this.blueprints.add(key);
      this.notifyListeners();
    }
  }

  public removeBlueprint(pos: Vector3) {
    const key = `${pos.x},${pos.y},${pos.z}`;
    if (this.blueprints.delete(key)) {
      this.notifyListeners();
    }
  }

  public hasBlueprint(pos: Vector3): boolean {
    return this.blueprints.has(`${pos.x},${pos.y},${pos.z}`);
  }

  public getBlueprints(): Vector3[] {
    return Array.from(this.blueprints).map((key) => {
      const [x, y, z] = key.split(',').map(Number);
      return { x, y, z };
    });
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }
}
