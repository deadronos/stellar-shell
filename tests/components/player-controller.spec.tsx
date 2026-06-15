import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PlayerController } from '../../src/components/PlayerController';
import { useStore } from '../../src/state/store';

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: () => ({
    camera: {
      position: { copy: vi.fn(), set: vi.fn() },
      rotation: { set: vi.fn(), order: '' },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      lookAt: vi.fn(),
    },
    gl: {
      domElement: window.document.createElement('canvas'),
    },
  }),
}));

describe('PlayerController', () => {
  beforeEach(() => {
    useStore.setState({ selectedTool: 'LASER' });
  });

  it('instantiates without crashing', () => {
    expect(PlayerController).toBeDefined();
  });

  it('selects LASER tool on Digit1 keydown', () => {
    useStore.setState({ selectedTool: 'BUILD' });
    render(<PlayerController />);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit1' }));
    expect(useStore.getState().selectedTool).toBe('LASER');
  });

  it('selects BUILD tool on Digit2 keydown', () => {
    useStore.setState({ selectedTool: 'LASER' });
    render(<PlayerController />);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit2' }));
    expect(useStore.getState().selectedTool).toBe('BUILD');
  });
});
