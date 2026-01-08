import { describe, it, expect, vi } from 'vitest';
import { VoxelWorld } from '../../src/scenes/VoxelWorld';
import { Drones } from '../../src/scenes/Drones';
import { Sun } from '../../src/scenes/Sun';

// Mock R3F hooks
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    useThree: () => ({
        scene: {
            fog: null,
            add: vi.fn(),
            remove: vi.fn()
        }
    }),
    extend: vi.fn()
}));

// Mock drei
vi.mock('@react-three/drei', () => ({
    Instance: () => null,
    Instances: ({ children }: { children?: React.ReactNode }) => children,
    Text: () => null
}));

describe('Scenes', () => {
    it('VoxelWorld is defined', () => {
        expect(VoxelWorld).toBeDefined();
    });

    it('Drones is defined', () => {
        expect(Drones).toBeDefined();
    });

    it('Sun is defined', () => {
        expect(Sun).toBeDefined();
    });
});
