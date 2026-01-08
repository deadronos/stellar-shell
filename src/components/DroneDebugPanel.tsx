import React, { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { ECS, Entity } from '../ecs/world';

export const DroneDebugPanel = () => {
  const showDebugPanel = useStore((state) => state.showDebugPanel);
  const [drones, setDrones] = useState<Entity[]>([]);

  // Update drone list periodically to avoid thrashing React with every frame 
  useEffect(() => {
    if (!showDebugPanel) return;

    const interval = setInterval(() => {
        const droneEntities = ECS.with('isDrone', 'position', 'state').entities;
        setDrones([...droneEntities]); // Create copy to trigger re-render
    }, 500); // 2Hz update rate

    return () => clearInterval(interval);
  }, [showDebugPanel]);

  if (!showDebugPanel) return null;

  return (
    <div className="fixed top-20 right-6 z-40 w-80 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-4 font-mono text-xs max-h-[80vh] overflow-y-auto pointer-events-auto">
      <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider sticky top-0 bg-black/80 py-2 border-b border-white/10">
        Drone Debugger ({drones.length})
      </h3>
      <div className="space-y-2">
        {drones.map((drone) => (
          <div key={drone.id} className="border border-white/5 bg-white/5 p-2 rounded hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-center mb-1">
               <span className="text-gray-400">ID: {drone.id}</span>
               <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStateColor(drone.state)}`}>
                 {drone.state}
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
              <div>
                Pos: {formatVec3(drone.position)}
              </div>
              <div>
                Target: {drone.target ? formatVec3(drone.target) : 'NONE'}
              </div>
            </div>

            {drone.targetBlock && (
               <div className="mt-1 text-[10px] text-yellow-500/80">
                  Target Block: [{drone.targetBlock.x}, {drone.targetBlock.y}, {drone.targetBlock.z}]
               </div>
            )}
             
            {drone.carryingType && (
                 <div className="mt-1 text-[10px] text-purple-400">
                    Carrying: {drone.carryingType}
                 </div>
            )}
          </div>
        ))}
        {drones.length === 0 && (
            <div className="text-gray-600 italic text-center py-4">No active drones</div>
        )}
      </div>
    </div>
  );
};

const formatVec3 = (v: { x: number, y: number, z: number }) => `(${v.x.toFixed(0)}, ${v.y.toFixed(0)}, ${v.z.toFixed(0)})`;

const getStateColor = (state?: string) => {
    switch(state) {
        case 'IDLE': return 'bg-gray-700 text-gray-300';
        case 'MINING': return 'bg-red-900 text-red-300';
        case 'BUILDING': return 'bg-cyan-900 text-cyan-300';
        case 'MOVING_TO_MINE': return 'bg-yellow-900 text-yellow-300';
        case 'MOVING_TO_BUILD': return 'bg-blue-900 text-blue-300';
        case 'RETURNING': return 'bg-purple-900 text-purple-300';
        default: return 'bg-gray-800 text-white';
    }
};
