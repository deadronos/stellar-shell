import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../../src/components/SettingsModal';
import { useStore } from '../../src/state/store';

// Mock the zustand hook so we can control the state/actions
vi.mock('../../src/state/store', () => ({
  useStore: vi.fn(),
}));

describe('SettingsModal', () => {
  it('renders auto-blueprint toggle and calls store action when clicked', () => {
    const mockToggle = vi.fn();
    // Provide initial state with settings open and auto disabled
    (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        isSettingsOpen: true,
        showDebugPanel: false,
        asteroidOrbitEnabled: false,
        asteroidOrbitRadius: 0,
        asteroidOrbitSpeed: 0,
        asteroidOrbitVerticalAmplitude: 0,
        autoBlueprintEnabled: false,
        toggleSettings: vi.fn(),
        toggleDebugPanel: vi.fn(),
        setAsteroidOrbitEnabled: vi.fn(),
        setAsteroidOrbitRadius: vi.fn(),
        setAsteroidOrbitSpeed: vi.fn(),
        setAsteroidOrbitVerticalAmplitude: vi.fn(),
        toggleAutoBlueprint: mockToggle,
      } as any;

      return selector ? selector(state) : state;
    });

    render(<SettingsModal />);

    const checkbox = screen.getByRole('checkbox', { name: /Auto Blueprint/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockToggle).toHaveBeenCalled();
  });
});
