import { create } from 'zustand';
import { BlockType } from '../types';

// LCG constants from Numerical Recipes – produce a uniform pseudo-random sequence.
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

interface StoreState {
  matter: number;
  rareMatter: number;
  energy: number;
  energyGenerationRate: number;
  droneCount: number;
  droneCost: number;
  prestigeLevel: number;
  /** Persistent meta-currency earned on each System Jump. Never reset. */
  stellarCrystals: number;
  /** Seed that drives procedural variation for the current star system. Updated on each jump. */
  systemSeed: number;
  selectedTool: 'LASER' | 'BUILD';
  selectedBlueprint: BlockType;
  asteroidOrbitEnabled: boolean;
  asteroidOrbitRadius: number;
  asteroidOrbitSpeed: number;
  asteroidOrbitVerticalAmplitude: number;

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
  setAsteroidOrbitEnabled: (enabled: boolean) => void;
  setAsteroidOrbitRadius: (radius: number) => void;
  setAsteroidOrbitSpeed: (speed: number) => void;
  setAsteroidOrbitVerticalAmplitude: (amplitude: number) => void;
  
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
  stellarCrystals: 0,
  systemSeed: 0,
  selectedTool: 'LASER',
  selectedBlueprint: BlockType.FRAME,
  asteroidOrbitEnabled: false,
  asteroidOrbitRadius: 24,
  asteroidOrbitSpeed: 0.08,
  asteroidOrbitVerticalAmplitude: 2,
  isSettingsOpen: false,
  showDebugPanel: false,

  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  toggleDebugPanel: () => set((state) => ({ showDebugPanel: !state.showDebugPanel })),

  addMatter: (amount) => set((state) => ({ matter: state.matter + amount })),
  addRareMatter: (amount) => set((state) => ({ rareMatter: state.rareMatter + amount })),
  addEnergy: (amount) => set((state) => ({ energy: state.energy + amount })),
  setEnergyRate: (rate) => set({ energyGenerationRate: rate }),
  
  resetWorld: () => set((state) => {
    // ── PRESTIGE ECONOMY ──────────────────────────────────────────────────────
    // Crystals earned this run: rare-matter haul + per-prestige bonus.
    const crystalsEarned = Math.floor(state.rareMatter / 2) + state.prestigeLevel * 5;
    // Next seed via LCG – gives deterministic per-system variation.
    const nextSeed = ((state.systemSeed * LCG_MULTIPLIER + LCG_INCREMENT) & 0x7fffffff);
    return {
      // ── RESET (per-system state) ───────────────────────────────────────────
      matter: 0,
      rareMatter: 0,
      energy: 0,
      energyGenerationRate: 0,
      droneCount: 0,
      droneCost: 50,
      // ── KEEP (persistent across jumps) ────────────────────────────────────
      prestigeLevel: state.prestigeLevel + 1,
      stellarCrystals: state.stellarCrystals + crystalsEarned,
      systemSeed: nextSeed,
    };
  }),

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
  setAsteroidOrbitEnabled: (enabled) => set({ asteroidOrbitEnabled: enabled }),
  setAsteroidOrbitRadius: (radius) => set({ asteroidOrbitRadius: Math.max(0, radius) }),
  setAsteroidOrbitSpeed: (speed) => set({ asteroidOrbitSpeed: speed }),
  setAsteroidOrbitVerticalAmplitude: (amplitude) =>
    set({ asteroidOrbitVerticalAmplitude: Math.max(0, amplitude) }),
}));
