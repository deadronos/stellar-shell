import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';

describe('useStore', () => {
    beforeEach(() => {
        useStore.setState({
            matter: 0,
            rareMatter: 0,
            energy: 0,
            droneCount: 0,
            droneCost: 10,
            selectedTool: 'LASER',
            selectedBlueprint: BlockType.FRAME,
            asteroidOrbitEnabled: false,
            asteroidOrbitRadius: 24,
            asteroidOrbitSpeed: 0.08,
            asteroidOrbitVerticalAmplitude: 2,
        });
    });

    it('addMatter increments matter', () => {
        const { addMatter } = useStore.getState();
        addMatter(100);
        expect(useStore.getState().matter).toBe(100);
    });

    it('consumeMatter decrements matter if sufficient', () => {
        useStore.setState({ matter: 100 });
        const { consumeMatter } = useStore.getState();
        
        const success = consumeMatter(50);
        expect(success).toBe(true);
        expect(useStore.getState().matter).toBe(50);
    });

    it('consumeMatter returns false if insufficient matter', () => {
        useStore.setState({ matter: 10 });
        const { consumeMatter } = useStore.getState();
        
        const success = consumeMatter(50);
        expect(success).toBe(false);
        expect(useStore.getState().matter).toBe(10);
    });
    it('consumeRareMatter decrements rare matter if sufficient', () => {
        useStore.setState({ rareMatter: 10 });
        const { consumeRareMatter } = useStore.getState();
        
        const success = consumeRareMatter(2);
        expect(success).toBe(true);
        expect(useStore.getState().rareMatter).toBe(8);
    });

    it('consumeRareMatter failures', () => {
        useStore.setState({ rareMatter: 1 });
        const { consumeRareMatter } = useStore.getState();
        
        expect(consumeRareMatter(2)).toBe(false);
        expect(useStore.getState().rareMatter).toBe(1);
    });
    it('resetWorld resets resources but increments prestige', () => {
        useStore.setState({ 
            matter: 1000, 
            energy: 500, 
            droneCount: 10,
            prestigeLevel: 0
        });
        
        const { resetWorld } = useStore.getState();
        resetWorld();
        
        const state = useStore.getState();
        expect(state.matter).toBe(0);
        expect(state.energy).toBe(0);
        expect(state.droneCount).toBe(0);
        expect(state.prestigeLevel).toBe(1);
    });

    it('resetWorld grants stellarCrystals based on rareMatter and prestige', () => {
        useStore.setState({ rareMatter: 20, prestigeLevel: 2, stellarCrystals: 5 });

        useStore.getState().resetWorld();

        const state = useStore.getState();
        // crystalsEarned = floor(20 / 2) + 2 * 5 = 10 + 10 = 20; total = 5 + 20 = 25
        expect(state.stellarCrystals).toBe(25);
    });

    it('stellarCrystals persist and accumulate across multiple jumps', () => {
        useStore.setState({ rareMatter: 10, prestigeLevel: 0, stellarCrystals: 0 });

        useStore.getState().resetWorld(); // earns floor(10/2) + 0*5 = 5
        expect(useStore.getState().stellarCrystals).toBe(5);

        // Second jump with prestige 1 and no rareMatter
        useStore.setState({ rareMatter: 0 });
        useStore.getState().resetWorld(); // earns 0 + 1*5 = 5; total = 10
        expect(useStore.getState().stellarCrystals).toBe(10);
    });

    it('systemSeed changes after each resetWorld', () => {
        useStore.setState({ systemSeed: 0 });
        const seed0 = useStore.getState().systemSeed;

        useStore.getState().resetWorld();
        const seed1 = useStore.getState().systemSeed;

        useStore.getState().resetWorld();
        const seed2 = useStore.getState().systemSeed;

        expect(seed1).not.toBe(seed0);
        expect(seed2).not.toBe(seed1);
        // Same initial seed always produces the same sequence (deterministic)
        useStore.setState({ systemSeed: 0, prestigeLevel: 0, stellarCrystals: 0, rareMatter: 0 });
        useStore.getState().resetWorld();
        expect(useStore.getState().systemSeed).toBe(seed1);
    });

    it('clamps orbit radius and vertical amplitude to non-negative values', () => {
        const { setAsteroidOrbitRadius, setAsteroidOrbitVerticalAmplitude } = useStore.getState();

        setAsteroidOrbitRadius(-5);
        setAsteroidOrbitVerticalAmplitude(-3);

        const state = useStore.getState();
        expect(state.asteroidOrbitRadius).toBe(0);
        expect(state.asteroidOrbitVerticalAmplitude).toBe(0);
    });

    it('allows negative orbit speed to support reverse direction', () => {
        const { setAsteroidOrbitSpeed } = useStore.getState();

        setAsteroidOrbitSpeed(-0.2);

        expect(useStore.getState().asteroidOrbitSpeed).toBe(-0.2);
    });
});
