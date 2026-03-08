import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';
import { createEmptyDroneRoleTargets } from '../../src/utils/droneRoles';

describe('useStore', () => {
    beforeEach(() => {
        useStore.setState({
            matter: 0,
            rareMatter: 0,
            energy: 0,
            research: 0,
            droneCount: 0,
            droneCost: 10,
            selectedTool: 'LASER',
            selectedBlueprint: BlockType.FRAME,
            asteroidOrbitEnabled: false,
            asteroidOrbitRadius: 24,
            asteroidOrbitSpeed: 0.08,
            asteroidOrbitVerticalAmplitude: 2,
            autoBlueprintEnabled: false,
            autoReplicatorEnabled: false,
            manualDroneRoleTargets: createEmptyDroneRoleTargets(),
            upgrades: {
                MINING_SPEED_1: false,
                DRONE_SPEED_1: false,
                LASER_EFFICIENCY_1: false,
                AUTO_REPLICATOR: false,
                DEEP_SCAN_1: false,
                ADVANCED_EXPLORER: false,
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
        useStore.setState({ matter: 200, upgrades: { MINING_SPEED_1: true, DRONE_SPEED_1: false, LASER_EFFICIENCY_1: false, AUTO_REPLICATOR: false, DEEP_SCAN_1: false, ADVANCED_EXPLORER: false } });
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

    it('enables runtime auto-replicator mode when AUTO_REPLICATOR is purchased', () => {
        useStore.setState({ matter: 0, rareMatter: 20, autoReplicatorEnabled: false });

        const result = useStore.getState().purchaseUpgrade('AUTO_REPLICATOR');

        expect(result).toBe(true);
        expect(useStore.getState().upgrades.AUTO_REPLICATOR).toBe(true);
        expect(useStore.getState().autoReplicatorEnabled).toBe(true);
    });

    it('toggleAutoReplicator flips runtime mode without removing ownership', () => {
        useStore.setState({
            autoReplicatorEnabled: true,
            upgrades: {
                MINING_SPEED_1: false,
                DRONE_SPEED_1: false,
                LASER_EFFICIENCY_1: false,
                AUTO_REPLICATOR: true,
                DEEP_SCAN_1: false,
                ADVANCED_EXPLORER: false,
            },
        });

        const { toggleAutoReplicator } = useStore.getState();
        toggleAutoReplicator();
        expect(useStore.getState().autoReplicatorEnabled).toBe(false);
        expect(useStore.getState().upgrades.AUTO_REPLICATOR).toBe(true);

        toggleAutoReplicator();
        expect(useStore.getState().autoReplicatorEnabled).toBe(true);
        expect(useStore.getState().upgrades.AUTO_REPLICATOR).toBe(true);
    });

    it('resetWorld resets upgrades', () => {
        useStore.setState({ upgrades: { MINING_SPEED_1: true, DRONE_SPEED_1: true, LASER_EFFICIENCY_1: true, AUTO_REPLICATOR: true, DEEP_SCAN_1: true, ADVANCED_EXPLORER: true }, autoReplicatorEnabled: true });
        useStore.getState().resetWorld();
        const { upgrades } = useStore.getState();
        expect(upgrades.MINING_SPEED_1).toBe(false);
        expect(upgrades.DRONE_SPEED_1).toBe(false);
        expect(upgrades.LASER_EFFICIENCY_1).toBe(false);
        expect(upgrades.AUTO_REPLICATOR).toBe(false);
        expect(upgrades.DEEP_SCAN_1).toBe(false);
        expect(upgrades.ADVANCED_EXPLORER).toBe(false);
        expect(useStore.getState().autoReplicatorEnabled).toBe(false);
    });

    // Research tests
    it('research initializes at 0', () => {
        expect(useStore.getState().research).toBe(0);
    });

    it('addResearch increments research', () => {
        useStore.getState().addResearch(5);
        expect(useStore.getState().research).toBe(5);
        useStore.getState().addResearch(3);
        expect(useStore.getState().research).toBe(8);
    });

    it('increments manual role targets within the available drone pool', () => {
        useStore.setState({ droneCount: 3 });

        const { adjustDroneRoleTarget } = useStore.getState();
        adjustDroneRoleTarget('MINER', 1);
        adjustDroneRoleTarget('EXPLORER', 1);

        expect(useStore.getState().manualDroneRoleTargets).toEqual({
            MINER: 1,
            BUILDER: 0,
            EXPLORER: 1,
        });
    });

    it('does not allow manual role targets to exceed the drone pool', () => {
        useStore.setState({ droneCount: 1 });

        const { adjustDroneRoleTarget } = useStore.getState();
        adjustDroneRoleTarget('MINER', 1);
        adjustDroneRoleTarget('BUILDER', 1);

        expect(useStore.getState().manualDroneRoleTargets).toEqual({
            MINER: 1,
            BUILDER: 0,
            EXPLORER: 0,
        });
    });

    it('does not allow manual role targets to go below zero', () => {
        const { adjustDroneRoleTarget } = useStore.getState();

        adjustDroneRoleTarget('BUILDER', -1);

        expect(useStore.getState().manualDroneRoleTargets).toEqual(createEmptyDroneRoleTargets());
    });

    it('research persists across resetWorld', () => {
        useStore.setState({ research: 20 });
        useStore.getState().resetWorld();
        expect(useStore.getState().research).toBe(20);
    });

    it('resetWorld resets manual drone role targets', () => {
        useStore.setState({
            droneCount: 5,
            manualDroneRoleTargets: {
                MINER: 2,
                BUILDER: 1,
                EXPLORER: 1,
            },
        });

        useStore.getState().resetWorld();

        expect(useStore.getState().manualDroneRoleTargets).toEqual(createEmptyDroneRoleTargets());
    });

    it('purchaseUpgrade deducts research for research-gated upgrades', () => {
        useStore.setState({ matter: 0, rareMatter: 0, research: 10 });
        const result = useStore.getState().purchaseUpgrade('DEEP_SCAN_1');
        expect(result).toBe(true);
        expect(useStore.getState().upgrades.DEEP_SCAN_1).toBe(true);
        expect(useStore.getState().research).toBe(5); // 10 - 5 cost
    });

    it('purchaseUpgrade fails when research is insufficient', () => {
        useStore.setState({ matter: 0, rareMatter: 0, research: 3 });
        const result = useStore.getState().purchaseUpgrade('DEEP_SCAN_1');
        expect(result).toBe(false);
        expect(useStore.getState().upgrades.DEEP_SCAN_1).toBe(false);
        expect(useStore.getState().research).toBe(3); // unchanged
    });
});
