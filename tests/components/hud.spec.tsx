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
                selectedTool: 'LASER',
                selectedBlueprint: 0
            };
            return selector ? selector(state) : state;
        });

        render(<HUD />);

        // Check for Matter label and value separately as they are in different elements
        expect(screen.getByText(/Matter/i)).toBeInTheDocument();
        expect(screen.getByText(/100/i)).toBeInTheDocument();

        // Check for Drones label and value
        expect(screen.getByText(/Drones/i)).toBeInTheDocument();
        expect(screen.getByText(/5/i)).toBeInTheDocument();
    });
});
