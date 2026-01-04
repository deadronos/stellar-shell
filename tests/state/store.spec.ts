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
});
