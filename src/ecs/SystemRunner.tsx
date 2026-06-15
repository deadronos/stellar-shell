import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import { BrainSystem } from './systems/BrainSystem';
import { MovementSystem } from './systems/MovementSystem';
import { ChunkSystem } from './systems/ChunkSystem';
import { ECS } from './world';
import { useStore } from '../state/store';
import { EnergySystem } from './systems/EnergySystem';
import { MiningSystem } from './systems/MiningSystem';
import { ConstructionSystem } from './systems/ConstructionSystem';
import { PlayerSystem } from './systems/PlayerSystem';
import { TrailSystem } from './systems/TrailSystem';
import { AsteroidOrbitSystem } from './systems/AsteroidOrbitSystem';
import { AutoBlueprintSystem } from './systems/AutoBlueprintSystem';
import { ExplorerSystem, resetExplorerSystem } from './systems/ExplorerSystem';
import { DroneFactory } from './DroneFactory';
import { RuntimeContextReact } from './RuntimeContextProvider';
import { createRuntimeContext } from './RuntimeContext';

const THROTTLE_INTERVAL_MS = 100; // 10Hz

export const SystemRunner = ({ children }: { children?: React.ReactNode }) => {
  // We can also handle Spawning logic here or in a separate SpawnerSystem
  const droneCount = useStore((state) => state.droneCount);

  // Own the canonical runtime service instances for the app lifetime.
  const runtime = useMemo(() => createRuntimeContext(), []);

  useEffect(() => {
    resetExplorerSystem();
  }, []);

  useEffect(() => {
    // Explicit world initialization (previously hidden inside BvxEngine.constructor).
    // This keeps engine construction side-effect free and makes HMR/dev reloads safe.
    runtime.engine.generateAsteroid(2, 0, 2, 20);
    runtime.engine.generateDysonBlueprintSkeleton(runtime.blueprints);

    // Sync ECS Population
    const drones = ECS.with('isDrone').entities;
    const currentCount = drones.length;

    if (currentCount < droneCount) {
      // Spawn more
      for (let i = currentCount; i < droneCount; i++) {
        DroneFactory.create();
      }
    } else if (currentCount > droneCount) {
      // Despawn extras
      for (let i = currentCount - 1; i >= droneCount; i--) {
        DroneFactory.destroy(drones[i]);
      }
    }
  }, [droneCount, runtime]);

  useEffect(() => {
    return () => {
      runtime.mesherPool.dispose();
    };
  }, [runtime]);

  const throttledTime = useRef(0);

  useFrame((state, delta) => {
    const elapsedTime = state.clock.elapsedTime;
    throttledTime.current += delta * 1000;

    const store = useStore.getState();

    if (throttledTime.current >= THROTTLE_INTERVAL_MS) {
      const throttledDelta = throttledTime.current / 1000;
      BrainSystem({ runtime, clock: state.clock });
      EnergySystem(throttledDelta);
      AutoBlueprintSystem({ runtime, delta: throttledDelta, elapsedTime });
      ExplorerSystem(throttledDelta);
      throttledTime.current -= THROTTLE_INTERVAL_MS;
    }

    MiningSystem({
      delta,
      elapsedTime,
      asteroidOrbitEnabled: store.asteroidOrbitEnabled,
      asteroidOrbitRadius: store.asteroidOrbitRadius,
      asteroidOrbitSpeed: store.asteroidOrbitSpeed,
      asteroidOrbitVerticalAmplitude: store.asteroidOrbitVerticalAmplitude,
      prestigeLevel: store.prestigeLevel,
      upgrades: store.upgrades,
      consumeEnergy: store.consumeEnergy,
      addMatter: store.addMatter,
      addRareMatter: store.addRareMatter,
      runtime,
    });

    ConstructionSystem({
      elapsedTime,
      asteroidOrbitEnabled: store.asteroidOrbitEnabled,
      asteroidOrbitRadius: store.asteroidOrbitRadius,
      asteroidOrbitSpeed: store.asteroidOrbitSpeed,
      asteroidOrbitVerticalAmplitude: store.asteroidOrbitVerticalAmplitude,
      consumeMatter: store.consumeMatter,
      consumeRareMatter: store.consumeRareMatter,
      consumeEnergy: store.consumeEnergy,
      setEnergyRate: store.setEnergyRate,
      setDysonProgress: store.setDysonProgress,
      runtime,
    });

    const movementStore = useStore.getState();
    MovementSystem({
      delta,
      energy: movementStore.energy,
      prestigeLevel: movementStore.prestigeLevel,
      upgrades: movementStore.upgrades,
    });

    AsteroidOrbitSystem(elapsedTime);
    ChunkSystem({ runtime });
    PlayerSystem({ runtime, delta, elapsedTime });
    TrailSystem({ runtime, delta });
  });

  return <RuntimeContextReact.Provider value={runtime}>{children}</RuntimeContextReact.Provider>;
};
