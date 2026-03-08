import { describe, expect, it } from 'vitest';
import {
  adjustManualDroneRoleTarget,
  computeDroneRoleAllocation,
  createEmptyDroneRoleTargets,
} from '../../src/utils/droneRoles';

describe('drone role allocation helpers', () => {
  it('splits unassigned drones as evenly as possible across all roles', () => {
    const allocation = computeDroneRoleAllocation(6, createEmptyDroneRoleTargets());

    expect(allocation.auto).toEqual({
      MINER: 2,
      BUILDER: 2,
      EXPLORER: 2,
    });
    expect(allocation.effective).toEqual({
      MINER: 2,
      BUILDER: 2,
      EXPLORER: 2,
    });
  });

  it('assigns odd remainders in miner, then builder, then explorer priority order', () => {
    const allocation = computeDroneRoleAllocation(5, createEmptyDroneRoleTargets());

    expect(allocation.auto).toEqual({
      MINER: 2,
      BUILDER: 2,
      EXPLORER: 1,
    });
    expect(allocation.effective).toEqual({
      MINER: 2,
      BUILDER: 2,
      EXPLORER: 1,
    });
  });

  it('combines manual targets with auto-fill remainder', () => {
    const allocation = computeDroneRoleAllocation(10, {
      MINER: 2,
      BUILDER: 1,
      EXPLORER: 0,
    });

    expect(allocation.manual).toEqual({
      MINER: 2,
      BUILDER: 1,
      EXPLORER: 0,
    });
    expect(allocation.auto).toEqual({
      MINER: 3,
      BUILDER: 2,
      EXPLORER: 2,
    });
    expect(allocation.effective).toEqual({
      MINER: 5,
      BUILDER: 3,
      EXPLORER: 2,
    });
  });

  it('caps manual role target increases at the total drone pool', () => {
    const oneDrone = adjustManualDroneRoleTarget(createEmptyDroneRoleTargets(), 1, 'MINER', 1);
    const blocked = adjustManualDroneRoleTarget(oneDrone, 1, 'BUILDER', 1);

    expect(blocked).toEqual({
      MINER: 1,
      BUILDER: 0,
      EXPLORER: 0,
    });
  });
});