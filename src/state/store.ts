import { create } from 'zustand';
import { BlockType } from '../types';

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
}

export const useStore = create<StoreState>((set, get) => ({
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
}));
