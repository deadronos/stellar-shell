import React from 'react';
import { useStore } from '../state/store';

export const SettingsModal = () => {
  const isSettingsOpen = useStore((state) => state.isSettingsOpen);
  const showDebugPanel = useStore((state) => state.showDebugPanel);
  const toggleSettings = useStore((state) => state.toggleSettings);
  const toggleDebugPanel = useStore((state) => state.toggleDebugPanel);

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
        </div>

        <div className="mt-8 text-center text-xs text-gray-600">
          Stellar Shell v0.1.0 dev
        </div>
      </div>
    </div>
  );
};
