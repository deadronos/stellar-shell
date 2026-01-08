import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerSystem } from '../../src/ecs/systems/PlayerSystem';
import { ECS } from '../../src/ecs/world';
import * as THREE from 'three';

// Mock BvxEngine
vi.mock('../../src/services/BvxEngine', () => {
    const mockEngine = {
        getBlock: vi.fn(),
        setBlock: vi.fn(),
    };
    return {
        BvxEngine: {
            getInstance: () => mockEngine
        }
    };
});

describe('PlayerSystem', () => {
    beforeEach(() => {
        ECS.clear();
        vi.clearAllMocks();
    });

    it('should move player when input is active', () => {
        const player = ECS.add({
            isPlayer: true,
            position: new THREE.Vector3(0, 0, 0),
            input: {
                forward: true,
                backward: false,
                left: false,
                right: false,
                up: false,
                down: false,
                mine: false,
                build: false,
            },
            cameraQuaternion: { x: 0, y: 0, z: 0, w: 1 }
        });

        // Run System
        PlayerSystem(1.0); // Delta 1s

        // Speed is 15. Directions: Forward is -Z (0,0,-1)
        expect(player.position.z).toBeCloseTo(-15);
        expect(player.position.x).toBe(0);
        expect(player.position.y).toBe(0);
    });

    it('should handle multiple inputs correctly', () => {
         const player = ECS.add({
            isPlayer: true,
            position: new THREE.Vector3(0, 0, 0),
            input: {
                forward: true,
                backward: false,
                left: false,
                right: true, // Right is +X
                up: false,
                down: false,
                mine: false,
                build: false,
            },
            cameraQuaternion: { x: 0, y: 0, z: 0, w: 1 }
        });
        
        PlayerSystem(1.0);

        // Vector should be normalized. (0, 0, -1) + (1, 0, 0) = (1, 0, -1). Length sqrt(2).
        // Normalized: (1/sqrt2, 0, -1/sqrt2) * 15 * 1
        // 1/sqrt(2) approx 0.707 * 15 = 10.6
        expect(player.position.x).toBeGreaterThan(10);
        expect(player.position.z).toBeLessThan(-10);
    });
});
