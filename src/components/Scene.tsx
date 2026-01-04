import React, { Suspense } from 'react';
import { Stars } from '@react-three/drei';
import { SystemRunner } from '../ecs/SystemRunner';
import { VoxelWorld } from '../scenes/VoxelWorld';
import { PlayerController } from './PlayerController';
import { Sun } from '../scenes/Sun';
import { Drones } from '../scenes/Drones';

export default function Scene() {
  return (
    <Suspense fallback={null}>
      <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sun />

      {/* Game World */}
      <SystemRunner />
      <VoxelWorld />
      <Drones />

      {/* Input & Camera */}
      <PlayerController />
    </Suspense>
  );
}
