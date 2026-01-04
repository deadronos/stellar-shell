import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BlockType } from '../types';
import { StateUpdateMessage } from '../types/messages';

interface StoreState {
  matter: number;
  energy: number;
  droneCount: number;
  droneCost: number;
  selectedTool: 'LASER' | 'BUILD';
  selectedBlueprint: BlockType;

  // Actions
  addMatter: (amount: number) => void;
  consumeMatter: (amount: number) => boolean;
  addDrone: () => void;
  setTool: (tool: 'LASER' | 'BUILD') => void;
  setBlueprint: (type: BlockType) => void;

  // Sync
  syncState: (payload: Partial<StoreState>) => void;
}

export const useStore = create(subscribeWithSelector<StoreState>((set, get) => ({
  matter: 0,
  energy: 100,
  droneCount: 0,
  droneCost: 50,
  selectedTool: 'LASER',
  selectedBlueprint: BlockType.FRAME,

  addMatter: (amount) => set((state) => ({ matter: state.matter + amount })),

  consumeMatter: (amount) => {
    const { matter } = get();
    if (matter >= amount) {
      set({ matter: matter - amount });
      return true;
    }
    return false;
  },

  addDrone: () => {
    const { matter, droneCost, droneCount } = get();
    if (matter >= droneCost) {
      set({
        matter: matter - droneCost,
        droneCount: droneCount + 1,
        droneCost: Math.floor(droneCost * 1.2),
      });
    }
  },

  setTool: (tool) => set({ selectedTool: tool }),
  setBlueprint: (type) => set({ selectedBlueprint: type }),

  syncState: (payload) => set(payload),
})));


// Helper to broadcast changes from Worker -> Main
// This should only be called if running in Worker context
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  useStore.subscribe(
    (state) => ({
        matter: state.matter,
        energy: state.energy,
        droneCount: state.droneCount,
        droneCost: state.droneCost
    }),
    (state) => {
        const msg: StateUpdateMessage = {
            type: 'STATE_UPDATE',
            payload: state
        };
        postMessage(msg);
    },
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) } // Shallow check
  );
}
