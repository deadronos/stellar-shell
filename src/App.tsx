import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { SystemRunner } from './ecs/SystemRunner';
import { VoxelWorld } from './scenes/VoxelWorld';
import { PlayerController } from './components/PlayerController';
import { Sun } from './scenes/Sun';
import { Drones } from './scenes/Drones';
import { HUD } from './components/HUD';

import { useStore } from './state/store';

// Post-processing could be added here, but keeping it simple for the single-file constraint robustness
export default function App() {
  React.useEffect(() => {
    // Expose for debugging in devtools; avoid `any` to satisfy lint rules
    (window as unknown as { gameStore?: typeof useStore }).gameStore = useStore;
  }, []);

  return (
    <>
      <div className="w-full h-full relative bg-black">
        <Canvas gl={{ antialias: false }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sun />
            <EffectComposer>
              <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
            </EffectComposer>

            {/* Game World */}
            <SystemRunner />
            <VoxelWorld />
            <Drones />

            {/* Input & Camera */}
            <PlayerController />
          </Suspense>
        </Canvas>

        {/* UI Overlay */}
        <HUD />
      </div>
    </>
  );
}
