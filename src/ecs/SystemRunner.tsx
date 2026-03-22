import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BrainSystem } from './systems/BrainSystem';
import { MovementSystem } from './systems/MovementSystem';
import { ChunkSystem } from './systems/ChunkSystem';
import { useEffect } from 'react';
import { ECS } from './world';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { BvxEngine } from '../services/BvxEngine';
import { EnergySystem } from './systems/EnergySystem';
import { MiningSystem } from './systems/MiningSystem';
import { ConstructionSystem } from './systems/ConstructionSystem';
import { PlayerSystem } from './systems/PlayerSystem';
import { TrailSystem } from './systems/TrailSystem';
import { AsteroidOrbitSystem } from './systems/AsteroidOrbitSystem';
import { AutoBlueprintSystem } from './systems/AutoBlueprintSystem';
import { ExplorerSystem, resetExplorerSystem } from './systems/ExplorerSystem';
import { getNextDroneEntityId } from './droneIdAllocator';

export const SystemRunner = () => {
    // We can also handle Spawning logic here or in a separate SpawnerSystem
    const droneCount = useStore((state) => state.droneCount);

  useEffect(() => {
    resetExplorerSystem();
  }, []);

    useEffect(() => {
        // Ensure Engine is initialized and world is generated
        BvxEngine.getInstance();

        // Sync ECS Population
        const drones = ECS.with('isDrone').entities;
        const currentCount = drones.length;

        if (currentCount < droneCount) {
          // Spawn more
          for (let i = currentCount; i < droneCount; i++) {
            ECS.add({
              id: getNextDroneEntityId(),
              position: new THREE.Vector3(0, 0, 0),
              velocity: new THREE.Vector3(0, 0, 0),
              isDrone: true,
              state: 'IDLE',
              carryingType: null,
              color: new THREE.Color('#ffcc00'),
            });
          }
        } else if (currentCount > droneCount) {
          // Despawn extras
          for (let i = currentCount - 1; i >= droneCount; i--) {
            ECS.remove(drones[i]);
          }
        }
      }, [droneCount]);

    const throttledTime = useRef(0);
    const THROTTLE_INTERVAL = 0.1; // 10Hz

    useFrame((state, delta) => {
        const elapsedTime = state.clock.elapsedTime;
        throttledTime.current += delta;

        if (throttledTime.current >= THROTTLE_INTERVAL) {
            BrainSystem(state.clock);
            EnergySystem(throttledTime.current);
            AutoBlueprintSystem(delta, elapsedTime);
            ExplorerSystem(throttledTime.current);
            throttledTime.current = 0;
        }

        MiningSystem(delta, elapsedTime);
        ConstructionSystem(delta, elapsedTime);
        MovementSystem(delta);
        AsteroidOrbitSystem(elapsedTime);
        ChunkSystem();
        PlayerSystem(delta, elapsedTime);
        TrailSystem(delta);
    });

    return null;
};
