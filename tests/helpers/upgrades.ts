import { UpgradeId } from '../../src/data/upgrades';

export function createTestUpgrades(
  overrides: Partial<Record<UpgradeId, boolean>> = {},
): Record<UpgradeId, boolean> {
  return {
    MINING_SPEED_1: false,
    DRONE_SPEED_1: false,
    LASER_EFFICIENCY_1: false,
    AUTO_REPLICATOR: false,
    DEEP_SCAN_1: false,
    ADVANCED_EXPLORER: false,
    ...overrides,
  };
}
