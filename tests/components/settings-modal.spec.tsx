import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../../src/components/SettingsModal';
import { useStore } from '../../src/state/store';

// Mock the zustand hook so we can control the state/actions
vi.mock('../../src/state/store', () => ({
  useStore: vi.fn(),
}));

type MockSettingsState = {
  isSettingsOpen: boolean;
  showDebugPanel: boolean;
  asteroidOrbitEnabled: boolean;
  asteroidOrbitRadius: number;
  asteroidOrbitSpeed: number;
  asteroidOrbitVerticalAmplitude: number;
  autoBlueprintEnabled: boolean;
  autoReplicatorEnabled: boolean;
  upgrades: {
    MINING_SPEED_1: boolean;
    DRONE_SPEED_1: boolean;
    LASER_EFFICIENCY_1: boolean;
    AUTO_REPLICATOR: boolean;
    DEEP_SCAN_1: boolean;
    ADVANCED_EXPLORER: boolean;
  };
  toggleSettings: () => void;
  toggleDebugPanel: () => void;
  setAsteroidOrbitEnabled: (enabled: boolean) => void;
  setAsteroidOrbitRadius: (radius: number) => void;
  setAsteroidOrbitSpeed: (speed: number) => void;
  setAsteroidOrbitVerticalAmplitude: (amplitude: number) => void;
  toggleAutoBlueprint: () => void;
  toggleAutoReplicator: () => void;
};

const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;

describe('SettingsModal', () => {
  it('renders auto-blueprint toggle and calls store action when clicked', () => {
    const mockToggle = vi.fn();
    // Provide initial state with settings open and auto disabled
    mockUseStore.mockImplementation((selector?: (state: MockSettingsState) => unknown) => {
      const state: MockSettingsState = {
        isSettingsOpen: true,
        showDebugPanel: false,
        asteroidOrbitEnabled: false,
        asteroidOrbitRadius: 0,
        asteroidOrbitSpeed: 0,
        asteroidOrbitVerticalAmplitude: 0,
        autoBlueprintEnabled: false,
        autoReplicatorEnabled: false,
        upgrades: {
          MINING_SPEED_1: false,
          DRONE_SPEED_1: false,
          LASER_EFFICIENCY_1: false,
          AUTO_REPLICATOR: false,
          DEEP_SCAN_1: false,
          ADVANCED_EXPLORER: false,
        },
        toggleSettings: vi.fn(),
        toggleDebugPanel: vi.fn(),
        setAsteroidOrbitEnabled: vi.fn(),
        setAsteroidOrbitRadius: vi.fn(),
        setAsteroidOrbitSpeed: vi.fn(),
        setAsteroidOrbitVerticalAmplitude: vi.fn(),
        toggleAutoBlueprint: mockToggle,
        toggleAutoReplicator: vi.fn(),
      };

      return selector ? selector(state) : state;
    });

    render(<SettingsModal />);

    const checkbox = screen.getByRole('checkbox', { name: /Auto Blueprint/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockToggle).toHaveBeenCalled();
  });

  it('renders auto-replicator runtime toggle when upgrade is owned', () => {
    const mockToggleReplicator = vi.fn();
    mockUseStore.mockImplementation((selector?: (state: MockSettingsState) => unknown) => {
      const state: MockSettingsState = {
        isSettingsOpen: true,
        showDebugPanel: false,
        asteroidOrbitEnabled: false,
        asteroidOrbitRadius: 0,
        asteroidOrbitSpeed: 0,
        asteroidOrbitVerticalAmplitude: 0,
        autoBlueprintEnabled: false,
        autoReplicatorEnabled: true,
        upgrades: {
          MINING_SPEED_1: false,
          DRONE_SPEED_1: false,
          LASER_EFFICIENCY_1: false,
          AUTO_REPLICATOR: true,
          DEEP_SCAN_1: false,
          ADVANCED_EXPLORER: false,
        },
        toggleSettings: vi.fn(),
        toggleDebugPanel: vi.fn(),
        setAsteroidOrbitEnabled: vi.fn(),
        setAsteroidOrbitRadius: vi.fn(),
        setAsteroidOrbitSpeed: vi.fn(),
        setAsteroidOrbitVerticalAmplitude: vi.fn(),
        toggleAutoBlueprint: vi.fn(),
        toggleAutoReplicator: mockToggleReplicator,
      };

      return selector ? selector(state) : state;
    });

    render(<SettingsModal />);

    const checkbox = screen.getByRole('checkbox', { name: /Auto-Replicator Runtime/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(mockToggleReplicator).toHaveBeenCalled();
  });
});
