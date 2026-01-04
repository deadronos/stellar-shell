import React, { StrictMode, Suspense } from 'react';
import { Canvas } from '@react-three/offscreen';
import { Stars } from '@react-three/drei';
import { SystemRunner } from './ecs/SystemRunner';
import { VoxelWorld } from './scenes/VoxelWorld';
import { PlayerController } from './components/PlayerController';
import { Sun } from './scenes/Sun';
import { Drones } from './scenes/Drones';
import { HUD } from './components/HUD';


// Worker thread
const worker = new Worker(new URL('./workers/scene.worker.tsx', import.meta.url), {
  type: 'module',
});


function Game() {
  const fallback = (
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

  return (
    <div className="w-full h-full relative bg-black">
      {/* Offscreen rendering: pass a worker and provide a main-thread fallback; do NOT pass children (they get cloned) */}
      <Canvas worker={worker} gl={{ antialias: false }} fallback={fallback} dpr={[1, 2]} />

      {/* UI Overlay */}
      <HUD />
    </div>
  );
}



// Post-processing could be added here, but keeping it simple for the single-file constraint robustness
export default function App() {
   return (
    <>
    <StrictMode>
      <Game />
    </StrictMode>
    </>
  );
}
