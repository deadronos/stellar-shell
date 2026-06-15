import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveGame,
  loadGame,
  clearSave,
  setStorageAdapter,
  PersistedState,
  StorageAdapter,
  STELLAR_SHELL_SAVE_VERSION,
} from '../../src/state/persistence';
import { createEmptyDroneRoleTargets } from '../../src/utils/droneRoles';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createInMemoryStorage(): StorageAdapter & { _store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    _store: store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

function makeDefaultSavedState(overrides: Partial<PersistedState> = {}): PersistedState {
  return {
    matter: 100,
    rareMatter: 5,
    energy: 200,
    droneCount: 3,
    droneCost: 80,
    prestigeLevel: 2,
    stellarCrystals: 15,
    research: 10,
    systemSeed: 42,
    upgrades: {
      MINING_SPEED_1: true,
      DRONE_SPEED_1: false,
      LASER_EFFICIENCY_1: false,
      AUTO_REPLICATOR: true,
      DEEP_SCAN_1: false,
      ADVANCED_EXPLORER: false,
    },
    dysonProgress: {
      blueprintFrames: 12,
      frames: 8,
      panels: 3,
      shells: 1,
      milestones: 0,
      prestigeReady: false,
    },
    manualDroneRoleTargets: {
      MINER: 2,
      BUILDER: 1,
      EXPLORER: 0,
    },
    version: STELLAR_SHELL_SAVE_VERSION,
    ...overrides,
  };
}

describe('persistence', () => {
  let storage: ReturnType<typeof createInMemoryStorage>;

  beforeEach(() => {
    storage = createInMemoryStorage();
    setStorageAdapter(storage);
  });

  describe('saveGame / loadGame round-trip', () => {
    it('saves and loads meta-progress correctly', () => {
      const state = makeDefaultSavedState();
      saveGame(state);

      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.matter).toBe(100);
      expect(loaded!.rareMatter).toBe(5);
      expect(loaded!.energy).toBe(200);
      expect(loaded!.droneCount).toBe(3);
      expect(loaded!.droneCost).toBe(80);
      expect(loaded!.prestigeLevel).toBe(2);
      expect(loaded!.stellarCrystals).toBe(15);
      expect(loaded!.research).toBe(10);
      expect(loaded!.systemSeed).toBe(42);
      expect(loaded!.version).toBe(STELLAR_SHELL_SAVE_VERSION);
    });

    it('saves and loads upgrades', () => {
      const state = makeDefaultSavedState();
      saveGame(state);

      const loaded = loadGame();
      expect(loaded!.upgrades.MINING_SPEED_1).toBe(true);
      expect(loaded!.upgrades.AUTO_REPLICATOR).toBe(true);
      expect(loaded!.upgrades.DRONE_SPEED_1).toBe(false);
    });

    it('saves and loads dyson progress', () => {
      const state = makeDefaultSavedState();
      saveGame(state);

      const loaded = loadGame();
      expect(loaded!.dysonProgress).toEqual(state.dysonProgress);
    });

    it('saves and loads manual drone role targets', () => {
      const state = makeDefaultSavedState();
      saveGame(state);

      const loaded = loadGame();
      expect(loaded!.manualDroneRoleTargets).toEqual(state.manualDroneRoleTargets);
    });

    it('returns null for missing key', () => {
      const loaded = loadGame();
      expect(loaded).toBeNull();
    });
  });

  describe('clearSave', () => {
    it('removes saved data so loadGame returns null', () => {
      saveGame(makeDefaultSavedState());
      expect(loadGame()).not.toBeNull();

      clearSave();
      expect(loadGame()).toBeNull();
    });
  });

  describe('corrupt / invalid data', () => {
    it('returns null for non-JSON data', () => {
      storage.setItem('stellar-shell-save-v1', 'not-json');
      expect(loadGame()).toBeNull();
    });

    it('returns null for JSON that is not a valid shape (missing keys)', () => {
      storage.setItem('stellar-shell-save-v1', JSON.stringify({ version: 1, matter: 5 }));
      expect(loadGame()).toBeNull();
    });

    it('returns null for JSON where matter is a string', () => {
      storage.setItem(
        'stellar-shell-save-v1',
        JSON.stringify({ ...makeDefaultSavedState(), matter: 'abc' }),
      );
      expect(loadGame()).toBeNull();
    });

    it('returns null when upgrades is not an object', () => {
      const invalid = { ...makeDefaultSavedState(), upgrades: 'not-an-object' };
      storage.setItem('stellar-shell-save-v1', JSON.stringify(invalid));
      expect(loadGame()).toBeNull();
    });

    it('returns null when dysonProgress is missing', () => {
      const { dysonProgress: _, ...rest } = makeDefaultSavedState();
      storage.setItem('stellar-shell-save-v1', JSON.stringify(rest));
      expect(loadGame()).toBeNull();
    });

    it('returns null when manualDroneRoleTargets has wrong shape', () => {
      storage.setItem(
        'stellar-shell-save-v1',
        JSON.stringify({
          ...makeDefaultSavedState(),
          manualDroneRoleTargets: { MINER: 1 },
        }),
      );
      expect(loadGame()).toBeNull();
    });

    it('returns null when version is missing', () => {
      const { version: _, ...rest } = makeDefaultSavedState();
      storage.setItem('stellar-shell-save-v1', JSON.stringify(rest));
      expect(loadGame()).toBeNull();
    });

    it('returns null when version is 0', () => {
      storage.setItem(
        'stellar-shell-save-v1',
        JSON.stringify({ ...makeDefaultSavedState(), version: 0 }),
      );
      expect(loadGame()).toBeNull();
    });

    it('returns null when saved version is newer than current', () => {
      storage.setItem(
        'stellar-shell-save-v1',
        JSON.stringify({ ...makeDefaultSavedState(), version: 999 }),
      );
      expect(loadGame()).toBeNull();
    });
  });

  describe('default values', () => {
    it('handles zero values correctly', () => {
      const state = makeDefaultSavedState({
        matter: 0,
        rareMatter: 0,
        energy: 0,
        droneCount: 0,
        prestigeLevel: 0,
        stellarCrystals: 0,
        research: 0,
        upgrades: {},
      });
      saveGame(state);

      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.matter).toBe(0);
      expect(loaded!.energy).toBe(0);
    });
  });

  describe('empty drone role targets', () => {
    it('preserves empty role targets', () => {
      const empty = createEmptyDroneRoleTargets();
      const state = makeDefaultSavedState({ manualDroneRoleTargets: empty });
      saveGame(state);

      const loaded = loadGame();
      expect(loaded!.manualDroneRoleTargets).toEqual({ MINER: 0, BUILDER: 0, EXPLORER: 0 });
    });
  });
});
