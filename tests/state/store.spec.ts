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
            autoBlueprintEnabled: false,
            upgrades: {
                MINING_SPEED_1: false,
                DRONE_SPEED_1: false,
                LASER_EFFICIENCY_1: false,
                AUTO_REPLICATOR: false,
            },
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

    // auto-blueprint tests
    it('should initialize autoBlueprintEnabled as false', () => {
        expect(useStore.getState().autoBlueprintEnabled).toBe(false);
    });

    it('should toggle autoBlueprintEnabled', () => {
        const { toggleAutoBlueprint, setAutoBlueprintEnabled } = useStore.getState();
        // start false
        expect(useStore.getState().autoBlueprintEnabled).toBe(false);
        toggleAutoBlueprint();
        expect(useStore.getState().autoBlueprintEnabled).toBe(true);
        // direct set
        setAutoBlueprintEnabled(false);
        expect(useStore.getState().autoBlueprintEnabled).toBe(false);
    });

    // Upgrade tests
    it('initializes all upgrades as false', () => {
        const { upgrades } = useStore.getState();
        expect(upgrades.MINING_SPEED_1).toBe(false);
        expect(upgrades.DRONE_SPEED_1).toBe(false);
        expect(upgrades.LASER_EFFICIENCY_1).toBe(false);
        expect(upgrades.AUTO_REPLICATOR).toBe(false);
    });

    it('purchaseUpgrade succeeds when resources are sufficient', () => {
        useStore.setState({ matter: 100, rareMatter: 0 });
        const result = useStore.getState().purchaseUpgrade('MINING_SPEED_1');
        expect(result).toBe(true);
        expect(useStore.getState().upgrades.MINING_SPEED_1).toBe(true);
        expect(useStore.getState().matter).toBe(50); // 100 - 50 cost
    });

    it('purchaseUpgrade fails when matter is insufficient', () => {
        useStore.setState({ matter: 10, rareMatter: 0 });
        const result = useStore.getState().purchaseUpgrade('MINING_SPEED_1');
        expect(result).toBe(false);
        expect(useStore.getState().upgrades.MINING_SPEED_1).toBe(false);
        expect(useStore.getState().matter).toBe(10);
    });

    it('purchaseUpgrade fails when already purchased', () => {
        useStore.setState({ matter: 200, upgrades: { MINING_SPEED_1: true, DRONE_SPEED_1: false, LASER_EFFICIENCY_1: false, AUTO_REPLICATOR: false } });
        const result = useStore.getState().purchaseUpgrade('MINING_SPEED_1');
        expect(result).toBe(false);
        expect(useStore.getState().matter).toBe(200); // unchanged
    });

    it('purchaseUpgrade deducts rareMatter for rare-cost upgrades', () => {
        useStore.setState({ matter: 0, rareMatter: 10 });
        const result = useStore.getState().purchaseUpgrade('LASER_EFFICIENCY_1');
        expect(result).toBe(true);
        expect(useStore.getState().upgrades.LASER_EFFICIENCY_1).toBe(true);
        expect(useStore.getState().rareMatter).toBe(5); // 10 - 5 cost
    });

    it('resetWorld resets upgrades', () => {
        useStore.setState({ upgrades: { MINING_SPEED_1: true, DRONE_SPEED_1: true, LASER_EFFICIENCY_1: true, AUTO_REPLICATOR: true } });
        useStore.getState().resetWorld();
        const { upgrades } = useStore.getState();
        expect(upgrades.MINING_SPEED_1).toBe(false);
        expect(upgrades.DRONE_SPEED_1).toBe(false);
        expect(upgrades.LASER_EFFICIENCY_1).toBe(false);
        expect(upgrades.AUTO_REPLICATOR).toBe(false);
    });
});
