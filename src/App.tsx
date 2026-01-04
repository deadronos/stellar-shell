import React, { StrictMode, useEffect } from 'react';
import { Canvas } from '@react-three/offscreen';
import { HUD } from './components/HUD';
import { InputCapture } from './components/InputCapture';
import { useStore } from './state/store';
import { MainMessage } from './types/messages';

// Worker thread
const worker = new Worker(new URL('./workers/scene.worker.tsx', import.meta.url), {
  type: 'module',
});

function Game() {
  const syncState = useStore((state) => state.syncState);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
        const msg = e.data as MainMessage;
        if (msg.type === 'STATE_UPDATE') {
            syncState(msg.payload);
        }
    };
    worker.addEventListener('message', onMessage);
    return () => worker.removeEventListener('message', onMessage);
  }, [syncState]);

  return (
    <div className="w-full h-full relative bg-black">
      {/* Offscreen rendering: pass a worker. Fallback is null because we want the worker to do everything. */}
      {/* If fallback is provided, it runs on main thread until worker is ready or if worker fails. */}
      {/* However, our PlayerController is refactored to use WorkerInput, so it won't work on Main Thread anymore unless we mock it. */}
      <Canvas worker={worker} gl={{ antialias: false }} fallback={null} dpr={[1, 2]} />

      <InputCapture worker={worker} />

      {/* UI Overlay */}
      <HUD />
    </div>
  );
}

export default function App() {
   return (
    <>
    <StrictMode>
      <Game />
    </StrictMode>
    </>
  );
}
