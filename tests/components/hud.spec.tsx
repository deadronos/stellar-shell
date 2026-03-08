import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HUD } from '../../src/components/HUD';
import { useStore } from '../../src/state/store';

// Mock store
vi.mock('../../src/state/store', () => ({
  useStore: vi.fn(),
}));

describe('HUD', () => {
    it('renders resources correctly', () => {
        // Mock implementation
        (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
            const state = {
                matter: 100,
                droneCount: 5,
                droneCost: 10,
                addDrone: vi.fn(),
                selectedTool: 'LASER',
                setTool: vi.fn(),
                rareMatter: 3,
                energy: 120,
                prestigeLevel: 1,
                stellarCrystals: 2,
                energyGenerationRate: 120,
                toggleSettings: vi.fn(),
                toggleUpgrades: vi.fn(),
                setDysonProgress: vi.fn(),
                dysonProgress: {
                    blueprintFrames: 4,
                    frames: 8,
                    panels: 16,
                    shells: 20,
                    milestones: 4,
                    prestigeReady: true,
                },
            };
            return selector ? selector(state) : state;
        });

        render(<HUD />);

        // Check for Matter label and value separately as they are in different elements
        expect(screen.getByText(/Matter/i)).toBeInTheDocument();
        expect(screen.getByText(/100/i)).toBeInTheDocument();

        // Check for Drones label and value
        expect(screen.getByText(/Drones/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Drones: 5/i)).toBeInTheDocument();
        expect(screen.getByText(/Dyson/i)).toBeInTheDocument();
        expect(screen.getByText(/F 8 · P 16 · S 20/i)).toBeInTheDocument();
        expect(screen.getByText(/Milestones 4\/4/i)).toBeInTheDocument();
        expect(screen.getByText(/Initiate System Jump/i)).toBeInTheDocument();
    });

    it('hides system jump until dyson prestige milestone is reached', () => {
        (useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
            const state = {
                matter: 100,
                droneCount: 5,
                droneCost: 10,
                addDrone: vi.fn(),
                selectedTool: 'LASER',
                setTool: vi.fn(),
                rareMatter: 3,
                energy: 120,
                prestigeLevel: 1,
                stellarCrystals: 2,
                energyGenerationRate: 120,
                toggleSettings: vi.fn(),
                toggleUpgrades: vi.fn(),
                setDysonProgress: vi.fn(),
                dysonProgress: {
                    blueprintFrames: 4,
                    frames: 8,
                    panels: 16,
                    shells: 10,
                    milestones: 3,
                    prestigeReady: false,
                },
            };
            return selector ? selector(state) : state;
        });

        render(<HUD />);

        expect(screen.queryByText(/Initiate System Jump/i)).not.toBeInTheDocument();
    });
});
