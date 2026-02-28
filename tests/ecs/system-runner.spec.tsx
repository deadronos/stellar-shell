import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';

// Prepare containers for mocks before importing SystemRunner
interface FakeState { clock: { elapsedTime: number } }
type FrameCallback = (state: FakeState, delta: number) => void;
const frameCallbacks: FrameCallback[] = [];
const mockAuto = vi.hoisted(() => vi.fn());

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: FrameCallback) => {
    frameCallbacks.push(cb);
  },
}));

vi.mock('../../src/ecs/systems/AutoBlueprintSystem', () => ({
  AutoBlueprintSystem: mockAuto,
}));

// stub all other systems to prevent noise
vi.mock('../../src/ecs/systems/BrainSystem', () => ({ BrainSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/MovementSystem', () => ({ MovementSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/ChunkSystem', () => ({ ChunkSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/EnergySystem', () => ({ EnergySystem: vi.fn() }));
vi.mock('../../src/ecs/systems/MiningSystem', () => ({ MiningSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/ConstructionSystem', () => ({ ConstructionSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/PlayerSystem', () => ({ PlayerSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/TrailSystem', () => ({ TrailSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/AsteroidOrbitSystem', () => ({ AsteroidOrbitSystem: vi.fn() }));

// mock store for droneCount dependency
vi.mock('../../src/state/store', () => ({
  useStore: vi.fn(() => 0),
}));

import { SystemRunner } from '../../src/ecs/SystemRunner';

describe('SystemRunner integration', () => {
  beforeEach(() => {
    frameCallbacks.length = 0;
    mockAuto.mockClear();
  });

  it('registers a frame callback and calls AutoBlueprintSystem with delta/elapsed', () => {
    render(<SystemRunner />);
    expect(frameCallbacks.length).toBe(1);

    const fakeState: FakeState = { clock: { elapsedTime: 2 } }; // state shape is not important for this test
    const fakeDelta = 0.123;
    // invoke the stored callback
    frameCallbacks[0](fakeState, fakeDelta);

    expect(mockAuto).toHaveBeenCalledWith(fakeDelta, 2);
  });
});
