import { create } from 'zustand';
import { BlockType } from '../types';

interface StoreState {
  matter: number;
  rareMatter: number;
  energy: number;
  energyGenerationRate: number;
  droneCount: number;
  droneCost: number;
  prestigeLevel: number;
  selectedTool: 'LASER' | 'BUILD';
  selectedBlueprint: BlockType;

  // UI State
  isSettingsOpen: boolean;
  showDebugPanel: boolean;

  // Actions
  resetWorld: () => void;
  addMatter: (amount: number) => void;
  addRareMatter: (amount: number) => void;
  addEnergy: (amount: number) => void;
  setEnergyRate: (rate: number) => void;
  consumeMatter: (amount: number) => boolean;
  consumeRareMatter: (amount: number) => boolean;
  addDrone: () => void;
  setTool: (tool: 'LASER' | 'BUILD') => void;
  setBlueprint: (type: BlockType) => void;
  
  // UI Actions
  toggleSettings: () => void;
  toggleDebugPanel: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  matter: 0,
  rareMatter: 0,
  energy: 100,
  energyGenerationRate: 0,
  droneCount: 0,
  droneCost: 50,
  prestigeLevel: 0,
  selectedTool: 'LASER',
  selectedBlueprint: BlockType.FRAME,
  isSettingsOpen: false,
  showDebugPanel: false,

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  toggleDebugPanel: () => set((state) => ({ showDebugPanel: !state.showDebugPanel })),

  addMatter: (amount) => set((state) => ({ matter: state.matter + amount })),
  addRareMatter: (amount) => set((state) => ({ rareMatter: state.rareMatter + amount })),
  addEnergy: (amount) => set((state) => ({ energy: state.energy + amount })),
  setEnergyRate: (rate) => set({ energyGenerationRate: rate }),
  
  resetWorld: () => set((state) => ({
      matter: 0,
      rareMatter: 0,
      energy: 0,
      energyGenerationRate: 0,
      droneCount: 0,
      droneCost: 50,
      prestigeLevel: state.prestigeLevel + 1
  })),

  consumeMatter: (amount) => {
    const { matter } = get();
    if (matter >= amount) {
      set({ matter: matter - amount });
      return true;
    }
    return false;
  },

  consumeRareMatter: (amount) => {
    const { rareMatter } = get();
    if (rareMatter >= amount) {
      set({ rareMatter: rareMatter - amount });
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
