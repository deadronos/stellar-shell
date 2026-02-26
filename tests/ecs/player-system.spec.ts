import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlayerSystem } from '../../src/ecs/systems/PlayerSystem';
import { ECS } from '../../src/ecs/world';
import * as THREE from 'three';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';
import { BvxEngine } from '../../src/services/BvxEngine';

const mockBlueprintManager = {
    addBlueprint: vi.fn(),
};

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

vi.mock('../../src/services/BlueprintManager', () => ({
    BlueprintManager: {
        getInstance: () => mockBlueprintManager,
    },
}));

describe('PlayerSystem', () => {
    beforeEach(() => {
        ECS.clear();
        vi.clearAllMocks();
        useStore.setState({
            matter: 0,
            selectedTool: 'LASER',
            asteroidOrbitEnabled: false,
            asteroidOrbitRadius: 24,
            asteroidOrbitSpeed: 0.08,
            asteroidOrbitVerticalAmplitude: 2,
        });

        const engine = BvxEngine.getInstance() as { getBlock: ReturnType<typeof vi.fn> };
        engine.getBlock.mockReturnValue(BlockType.AIR);
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

    it('mines the correct local voxel when orbit offset is active', () => {
        useStore.setState({
            selectedTool: 'LASER',
            asteroidOrbitEnabled: true,
            asteroidOrbitRadius: 10,
            asteroidOrbitSpeed: 1,
            asteroidOrbitVerticalAmplitude: 0,
            matter: 0,
        });

        const engine = BvxEngine.getInstance() as {
            getBlock: ReturnType<typeof vi.fn>;
            setBlock: ReturnType<typeof vi.fn>;
        };
        engine.getBlock.mockImplementation((x: number, y: number, z: number) =>
            x === 0 && y === 0 && z === 0 ? BlockType.ASTEROID_SURFACE : BlockType.AIR,
        );

        const player = ECS.add({
            isPlayer: true,
            position: new THREE.Vector3(10, 0, 1.2),
            input: {
                forward: false,
                backward: false,
                left: false,
                right: false,
                up: false,
                down: false,
                mine: true,
                build: false,
            },
            cameraQuaternion: { x: 0, y: 0, z: 0, w: 1 },
        });

        PlayerSystem(1 / 60, 0);

        expect(engine.setBlock).toHaveBeenCalledWith(0, 0, 0, BlockType.AIR);
        expect(useStore.getState().matter).toBe(1);
        expect(player.input.mine).toBe(false);
    });

    it('builds a blueprint in the correct local voxel when orbit offset is active', () => {
        useStore.setState({
            selectedTool: 'BUILD',
            asteroidOrbitEnabled: true,
            asteroidOrbitRadius: 10,
            asteroidOrbitSpeed: 1,
            asteroidOrbitVerticalAmplitude: 0,
        });

        const engine = BvxEngine.getInstance() as {
            getBlock: ReturnType<typeof vi.fn>;
            setBlock: ReturnType<typeof vi.fn>;
        };
        engine.getBlock.mockImplementation((x: number, y: number, z: number) =>
            x === 0 && y === 0 && z === 0 ? BlockType.ASTEROID_SURFACE : BlockType.AIR,
        );

        const player = ECS.add({
            isPlayer: true,
            position: new THREE.Vector3(10, 0, 1.2),
            input: {
                forward: false,
                backward: false,
                left: false,
                right: false,
                up: false,
                down: false,
                mine: false,
                build: true,
            },
            cameraQuaternion: { x: 0, y: 0, z: 0, w: 1 },
        });

        PlayerSystem(1 / 60, 0);

        expect(engine.setBlock).toHaveBeenCalledWith(0, 0, 1, BlockType.BLUEPRINT_FRAME);
        expect(mockBlueprintManager.addBlueprint).toHaveBeenCalledWith(
            expect.objectContaining({ x: 0, y: 0, z: 1 }),
        );
        expect(player.input.build).toBe(false);
    });
});
