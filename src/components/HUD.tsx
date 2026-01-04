import React from 'react';
import { useStore } from '../state/store';
import { BlockType } from '../types';

export const HUD = () => {
  const matter = useStore((state) => state.matter);
  const droneCount = useStore((state) => state.droneCount);
  const droneCost = useStore((state) => state.droneCost);
  const addDrone = useStore((state) => state.addDrone);
  const selectedTool = useStore((state) => state.selectedTool);
  const setTool = useStore((state) => state.setTool);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-6">
      {/* Top Bar: Resources */}
      <div className="flex gap-8 items-center bg-black/60 backdrop-blur border border-white/10 p-4 rounded-lg self-start pointer-events-auto">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest">Matter</div>
          <div className="text-2xl font-mono text-cyan-400">{matter} kg</div>
        </div>
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest">Rare</div>
          <div className="text-xl font-mono text-purple-300">{useStore((state) => state.rareMatter)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest">Drones</div>
          <div className="text-2xl font-mono text-yellow-400">{droneCount}</div>
        </div>
        <div className="h-8 w-px bg-white/20 mx-2"></div>
        <button
          onClick={addDrone}
          disabled={matter < droneCost}
          className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all
             ${
               matter >= droneCost
                 ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                 : 'bg-gray-800 text-gray-500 cursor-not-allowed'
             }`}
        >
          Build Drone ({droneCost})
        </button>
      </div>

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/50"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-white/50"></div>
      </div>

      {/* Bottom Bar: Toolbar */}
      <div className="self-center bg-black/60 backdrop-blur border border-white/10 p-2 rounded-xl flex gap-2 pointer-events-auto">
        <ToolButton
          label="1. Laser"
          active={selectedTool === 'LASER'}
          onClick={() => setTool('LASER')}
          color="text-red-400"
        />
        <ToolButton
          label="2. Frame"
          active={selectedTool === 'BUILD'}
          onClick={() => setTool('BUILD')}
          color="text-cyan-400"
        />
      </div>

      {/* Tutorial / Context */}
      <div className="absolute top-6 right-6 text-right space-y-1 opacity-70">
        <div className="text-xs text-gray-400">Controls</div>
        <div className="text-sm">WASD + Space/Shift to Fly</div>
        <div className="text-sm">Click + Drag to Look</div>
        <div className="text-sm">Click to Mine / Build</div>
      </div>
    </div>
  );
};

const ToolButton = ({ label, active, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-lg font-mono text-sm font-bold transition-all border
      ${
        active
          ? `bg-white/10 border-white/40 ${color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`
          : 'bg-transparent border-transparent text-gray-500 hover:text-white hover:bg-white/5'
      }`}
  >
    {label}
  </button>
);
