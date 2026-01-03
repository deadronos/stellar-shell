import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { VoxelWorld } from './components/VoxelWorld';
import { PlayerController } from './components/PlayerController';
import { Sun } from './components/Sun';
import { Drones } from './components/Drones';
import { HUD } from './components/HUD';

// Post-processing could be added here, but keeping it simple for the single-file constraint robustness
export default function App() {
  return (
    <>
      <div className="w-full h-full relative bg-black">
        <Canvas gl={{ antialias: false }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sun />
            
            {/* Game World */}
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