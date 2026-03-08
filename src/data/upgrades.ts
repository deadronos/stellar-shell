export const UPGRADE_IDS = {
  MINING_SPEED_1: 'MINING_SPEED_1',
  DRONE_SPEED_1: 'DRONE_SPEED_1',
  LASER_EFFICIENCY_1: 'LASER_EFFICIENCY_1',
  AUTO_REPLICATOR: 'AUTO_REPLICATOR',
  DEEP_SCAN_1: 'DEEP_SCAN_1',
  ADVANCED_EXPLORER: 'ADVANCED_EXPLORER',
} as const;

export type UpgradeId = (typeof UPGRADE_IDS)[keyof typeof UPGRADE_IDS];

export interface UpgradeDef {
  id: UpgradeId;
  label: string;
  description: string;
  matterCost: number;
  rareMatterCost: number;
  researchCost: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: UPGRADE_IDS.MINING_SPEED_1,
    label: 'Fast Drill',
    description: '+50% drone mining speed',
    matterCost: 50,
    rareMatterCost: 0,
    researchCost: 0,
  },
  {
    id: UPGRADE_IDS.DRONE_SPEED_1,
    label: 'Thruster Boost',
    description: '+50% drone flight speed',
    matterCost: 75,
    rareMatterCost: 0,
    researchCost: 0,
  },
  {
    id: UPGRADE_IDS.LASER_EFFICIENCY_1,
    label: 'Laser Capacitor',
    description: 'Player laser yields 2× resources per block',
    matterCost: 0,
    rareMatterCost: 5,
    researchCost: 0,
  },
  {
    id: UPGRADE_IDS.AUTO_REPLICATOR,
    label: 'Auto-Replicator',
    description: 'Automatically purchases drones when matter is sufficient',
    matterCost: 0,
    rareMatterCost: 10,
    researchCost: 0,
  },
  {
    id: UPGRADE_IDS.DEEP_SCAN_1,
    label: 'Deep Scan',
    description: 'Rare ore deposits yield 2 rare matter',
    matterCost: 0,
    rareMatterCost: 0,
    researchCost: 5,
  },
  {
    id: UPGRADE_IDS.ADVANCED_EXPLORER,
    label: 'Advanced Explorer',
    description: 'Assigned explorer drones generate 2× research',
    matterCost: 0,
    rareMatterCost: 0,
    researchCost: 10,
  },
];
