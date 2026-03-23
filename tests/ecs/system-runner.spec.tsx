import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';

// Prepare containers for mocks before importing SystemRunner
interface FakeState { clock: { elapsedTime: number } }
type FrameCallback = (state: FakeState, delta: number) => void;
const frameCallbacks: FrameCallback[] = [];
const mockStoreState = vi.hoisted(() => ({
  droneCount: 0,
  asteroidOrbitEnabled: false,
  asteroidOrbitRadius: 0,
  asteroidOrbitSpeed: 0,
  asteroidOrbitVerticalAmplitude: 0,
  prestigeLevel: 0,
  upgrades: {},
  energy: 100,
  consumeEnergy: vi.fn(),
  addMatter: vi.fn(),
  addRareMatter: vi.fn(),
  consumeMatter: vi.fn(),
  consumeRareMatter: vi.fn(),
  setEnergyRate: vi.fn(),
  setDysonProgress: vi.fn(),
}));
const mockAuto = vi.hoisted(() => vi.fn());
const mockResetExplorer = vi.hoisted(() => vi.fn());
const mockEnergySystem = vi.hoisted(() =>
  vi.fn(() => {
    mockStoreState.energy = 0;
  }),
);
const mockMovementSystem = vi.hoisted(() => vi.fn());

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
vi.mock('../../src/ecs/systems/MovementSystem', () => ({ MovementSystem: mockMovementSystem }));
vi.mock('../../src/ecs/systems/ChunkSystem', () => ({ ChunkSystem: vi.fn() }));
vi.mock('../../src/ecs/systems/EnergySystem', () => ({ EnergySystem: mockEnergySystem }));
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
  useStore: Object.assign(vi.fn((selector) => (selector ? selector(mockStoreState) : mockStoreState)), {
    getState: vi.fn(() => mockStoreState),
  })
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
    mockEnergySystem.mockClear();
    mockMovementSystem.mockClear();
    ECS.clear();
    resetDroneEntityIdsForTests();
    mockStoreState.droneCount = 0;
    mockStoreState.asteroidOrbitEnabled = false;
    mockStoreState.asteroidOrbitRadius = 0;
    mockStoreState.asteroidOrbitSpeed = 0;
    mockStoreState.asteroidOrbitVerticalAmplitude = 0;
    mockStoreState.prestigeLevel = 0;
    mockStoreState.upgrades = {};
    mockStoreState.energy = 100;
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

  it('preserves throttle remainder so closely spaced frames still advance logic', () => {
    render(<SystemRunner />);

    const fakeStateA: FakeState = { clock: { elapsedTime: 0.06 } };
    const fakeStateB: FakeState = { clock: { elapsedTime: 0.12 } };
    const fakeStateC: FakeState = { clock: { elapsedTime: 0.2 } };

    frameCallbacks[0](fakeStateA, 0.06);
    expect(mockAuto).not.toHaveBeenCalled();

    frameCallbacks[0](fakeStateB, 0.06);
    expect(mockAuto).toHaveBeenCalledTimes(1);

    frameCallbacks[0](fakeStateC, 0.08);
    expect(mockAuto).toHaveBeenCalledTimes(2);
  });

  it('passes the fresh energy snapshot to MovementSystem after throttled systems run', () => {
    render(<SystemRunner />);

    const fakeState: FakeState = { clock: { elapsedTime: 0.12 } };
    frameCallbacks[0](fakeState, 0.12);

    expect(mockEnergySystem).toHaveBeenCalledTimes(1);
    expect(mockMovementSystem).toHaveBeenCalledTimes(1);
    expect(mockMovementSystem).toHaveBeenCalledWith(
      expect.objectContaining({ energy: 0 }),
    );
  });
});
