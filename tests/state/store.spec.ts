import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/state/store';
import { BlockType } from '../../src/types';

describe('useStore', () => {
    beforeEach(() => {
        useStore.setState({
            matter: 0,
            energy: 0,
            droneCount: 0,
            droneCost: 10,
            selectedTool: 'LASER',
            selectedBlueprint: BlockType.FRAME
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
});
