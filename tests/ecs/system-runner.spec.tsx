import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';

// Prepare containers for mocks before importing SystemRunner
interface FakeState { clock: { elapsedTime: number } }
type FrameCallback = (state: FakeState, delta: number) => void;
const frameCallbacks: FrameCallback[] = [];
const mockAuto = vi.hoisted(() => vi.fn());
const mockResetExplorer = vi.hoisted(() => vi.fn());

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
vi.mock('../../src/ecs/systems/ExplorerSystem', () => ({
  ExplorerSystem: vi.fn(),
  resetExplorerSystem: mockResetExplorer,
}));

// mock store for droneCount dependency
vi.mock('../../src/state/store', () => ({
  useStore: vi.fn(() => 0),
}));

import { SystemRunner } from '../../src/ecs/SystemRunner';
import { resetDroneEntityIdsForTests } from '../../src/ecs/droneIdAllocator';
import { ECS } from '../../src/ecs/world';
import { useStore } from '../../src/state/store';

describe('SystemRunner integration', () => {
  beforeEach(() => {
    frameCallbacks.length = 0;
    mockAuto.mockClear();
    mockResetExplorer.mockClear();
    ECS.clear();
    resetDroneEntityIdsForTests();
  });

  it('registers a frame callback and calls AutoBlueprintSystem with delta/elapsed', () => {
    render(<SystemRunner />);
    expect(frameCallbacks.length).toBe(1);
    expect(mockResetExplorer).toHaveBeenCalledTimes(1);

    const fakeState: FakeState = { clock: { elapsedTime: 2 } }; // state shape is not important for this test
    const fakeDelta = 0.123;
    // invoke the stored callback
    frameCallbacks[0](fakeState, fakeDelta);

    expect(mockAuto).toHaveBeenCalledWith(fakeDelta, 2);
  });

  it('assigns stable numeric ids when spawning drones', async () => {
    const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;
    mockUseStore.mockImplementation((selector) => {
      const state = { droneCount: 2 };
      return selector ? selector(state) : state;
    });

    render(<SystemRunner />);

    const drones = ECS.with('isDrone').entities;
    expect(drones).toHaveLength(2);
    expect(drones.map((drone) => drone.id)).toEqual([1, 2]);
  });
});
