import { useFrame } from '@react-three/fiber';
import { BrainSystem } from './systems/BrainSystem';
import { MovementSystem } from './systems/MovementSystem';
import { ChunkSystem } from './systems/ChunkSystem';
import { useEffect } from 'react';
import { ECS } from './world';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { BvxEngine } from '../services/BvxEngine';

export const SystemRunner = () => {
    // We can also handle Spawning logic here or in a separate SpawnerSystem
    const droneCount = useStore((state) => state.droneCount);

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

    useFrame((state, delta) => {
        BrainSystem(state.clock);
        MovementSystem(delta);
        ChunkSystem();
    });

    return null;
};
