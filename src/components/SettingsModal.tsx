import React from 'react';
import { useStore } from '../state/store';

export const SettingsModal = () => {
  const isSettingsOpen = useStore((state) => state.isSettingsOpen);
  const showDebugPanel = useStore((state) => state.showDebugPanel);
  const asteroidOrbitEnabled = useStore((state) => state.asteroidOrbitEnabled);
  const asteroidOrbitRadius = useStore((state) => state.asteroidOrbitRadius);
  const asteroidOrbitSpeed = useStore((state) => state.asteroidOrbitSpeed);
  const asteroidOrbitVerticalAmplitude = useStore((state) => state.asteroidOrbitVerticalAmplitude);
  const autoBlueprintEnabled = useStore((state) => state.autoBlueprintEnabled);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const toggleDebugPanel = useStore((state) => state.toggleDebugPanel);
  const setAsteroidOrbitEnabled = useStore((state) => state.setAsteroidOrbitEnabled);
  const setAsteroidOrbitRadius = useStore((state) => state.setAsteroidOrbitRadius);
  const setAsteroidOrbitSpeed = useStore((state) => state.setAsteroidOrbitSpeed);
  const setAsteroidOrbitVerticalAmplitude = useStore(
    (state) => state.setAsteroidOrbitVerticalAmplitude,
  );
  const toggleAutoBlueprint = useStore((state) => state.toggleAutoBlueprint);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-96 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Settings</h2>
          <button 
            onClick={toggleSettings}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
            <span className="text-gray-300 font-mono text-sm">Show Drone Debugger</span>
            <input
              type="checkbox"
              checked={showDebugPanel}
              onChange={toggleDebugPanel}
              className="w-5 h-5 accent-cyan-400 rounded focus:ring-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
            <span className="text-gray-300 font-mono text-sm">Auto Blueprint</span>
            <input
              type="checkbox"
              checked={autoBlueprintEnabled}
              onChange={toggleAutoBlueprint}
              className="w-5 h-5 accent-cyan-400 rounded focus:ring-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
            <span className="text-gray-300 font-mono text-sm">Asteroid Orbit Motion</span>
            <input
              type="checkbox"
              checked={asteroidOrbitEnabled}
              onChange={(event) => setAsteroidOrbitEnabled(event.target.checked)}
              className="w-5 h-5 accent-cyan-400 rounded focus:ring-cyan-400"
            />
          </label>

          <label className="block p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-mono text-sm">Orbit Radius</span>
              <span className="text-cyan-300 font-mono text-xs">{asteroidOrbitRadius.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={1}
              value={asteroidOrbitRadius}
              onChange={(event) => setAsteroidOrbitRadius(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </label>

          <label className="block p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-mono text-sm">Orbit Speed</span>
              <span className="text-cyan-300 font-mono text-xs">{asteroidOrbitSpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-0.5}
              max={0.5}
              step={0.01}
              value={asteroidOrbitSpeed}
              onChange={(event) => setAsteroidOrbitSpeed(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </label>

          <label className="block p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-mono text-sm">Orbit Vertical Amplitude</span>
              <span className="text-cyan-300 font-mono text-xs">
                {asteroidOrbitVerticalAmplitude.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.1}
              value={asteroidOrbitVerticalAmplitude}
              onChange={(event) => setAsteroidOrbitVerticalAmplitude(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </label>
        </div>

        <div className="mt-8 text-center text-xs text-gray-600">
          Stellar Shell v0.1.0 dev
        </div>
      </div>
    </div>
  );
};
