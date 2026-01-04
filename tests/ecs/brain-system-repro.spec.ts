import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrainSystem } from '../../src/ecs/systems/BrainSystem';
import { ECS } from '../../src/ecs/world';
import * as THREE from 'three';
import { BlockType } from '../../src/types';

// Mock BvxEngine
const { mockFindMiningTargets, mockFindBlocksByType } = vi.hoisted(() => ({
    mockFindMiningTargets: vi.fn(),
    mockFindBlocksByType: vi.fn()
}));

vi.mock('../../src/services/BvxEngine', () => {
    return {
        BvxEngine: {
            getInstance: () => ({
                findMiningTargets: mockFindMiningTargets,
                findBlocksByType: mockFindBlocksByType,
            })
        }
    };
});

// Mock BlueprintManager
vi.mock('../../src/services/BlueprintManager', () => {
    return {
        BlueprintManager: {
            getInstance: () => ({
                getBlueprints: () => []
            })
        }
    };
});

// Mock Store
vi.mock('../../src/state/store', () => {
    return {
        useStore: {
            getState: () => ({
                matter: 100,
                droneCount: 1,
                energy: 100,
                rareMatter: 0
            })
        }
    };
});

describe('BrainSystem', () => {
    beforeEach(() => {
        ECS.clear();
        vi.clearAllMocks();
    });

    it('should assign mining target to IDLE drone when targets exist', () => {
        // Setup Drone
        const drone = ECS.add({
            isDrone: true,
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            state: 'IDLE',
            target: new THREE.Vector3(5,5,5) // Orbit target
        });

        // Setup Targets
        mockFindMiningTargets.mockReturnValue([{ x: 10, y: 0, z: 0 }]); // Target at distance 10
        mockFindBlocksByType.mockReturnValue([]); // No frames/panels to build/upgradesss

        // Run System
        const clock = new THREE.Clock();
        clock.elapsedTime = 1000; // Force cache refresh
        BrainSystem(clock);

        // Assert
        expect(drone.state).toBe('MOVING_TO_MINE');
        expect(drone.target).toBeDefined();
        if (drone.target) {
            expect(drone.target.x).toBe(10);
        }
        expect(drone.targetBlock).toEqual({ x: 10, y: 0, z: 0 });
    });
});
