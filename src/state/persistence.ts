import { DysonProgressMetrics } from '../types';
import { DroneRoleTargets } from '../utils/droneRoles';

// ── Types ──────────────────────────────────────────────────────────────────────

export const STELLAR_SHELL_SAVE_VERSION = 1;
const SAVE_KEY = 'stellar-shell-save-v1';

/**
 * Injectable storage interface so tests can swap in a mock
 * without touching real localStorage.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Subset of the full store state that survives a browser refresh. */
export interface PersistedState {
  matter: number;
  rareMatter: number;
  energy: number;
  droneCount: number;
  droneCost: number;
  prestigeLevel: number;
  stellarCrystals: number;
  research: number;
  systemSeed: number;
  upgrades: Record<string, boolean>;
  dysonProgress: DysonProgressMetrics;
  manualDroneRoleTargets: DroneRoleTargets;
  /** Schema version marker to detect stale / corrupted saves. */
  version: number;
}

// ── Adapter ────────────────────────────────────────────────────────────────────

let storageAdapter: StorageAdapter = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

/**
 * Replace the storage backend (intended for testing).
 * Pass the real localStorage adapter to restore defaults.
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  storageAdapter = adapter;
}

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Lightweight structural check – verifies that every required key
 * exists and has the expected type without pulling in a schema library.
 */
function isValidPersistedState(value: unknown): value is PersistedState {
  if (value === null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  const numberKeys = [
    'matter',
    'rareMatter',
    'energy',
    'droneCount',
    'droneCost',
    'prestigeLevel',
    'stellarCrystals',
    'research',
    'systemSeed',
    'version',
  ];
  for (const key of numberKeys) {
    if (typeof obj[key] !== 'number') return false;
  }

  if (typeof obj.version !== 'number' || obj.version < 1) return false;

  if (typeof obj.upgrades !== 'object' || obj.upgrades === null) return false;

  if (typeof obj.dysonProgress !== 'object' || obj.dysonProgress === null) return false;

  // manualDroneRoleTargets must be a valid shape
  const m = obj.manualDroneRoleTargets as Record<string, unknown> | null | undefined;
  if (!m || typeof m !== 'object') return false;
  for (const role of ['MINER', 'BUILDER', 'EXPLORER']) {
    if (typeof m[role] !== 'number') return false;
  }

  return true;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Serialize a subset of the full store to persistent storage.
 */
export function saveGame(state: PersistedState): void {
  const data: PersistedState = {
    ...state,
    version: STELLAR_SHELL_SAVE_VERSION,
  };
  storageAdapter.setItem(SAVE_KEY, JSON.stringify(data));
}

/**
 * Read and validate previously persisted state.
 * Returns `null` when there is no save, the save is corrupt,
 * or its version is too old to safely migrate.
 */
export function loadGame(): PersistedState | null {
  try {
    const raw = storageAdapter.getItem(SAVE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidPersistedState(parsed)) return null;

    // Future proofing: reject saves from a newer version of the app.
    if (parsed.version > STELLAR_SHELL_SAVE_VERSION) return null;

    return parsed;
  } catch {
    // Corrupt JSON or storage error → fresh start.
    return null;
  }
}

/**
 * Remove the persisted save from storage.
 */
export function clearSave(): void {
  storageAdapter.removeItem(SAVE_KEY);
}
