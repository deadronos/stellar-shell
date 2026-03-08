export const DRONE_ROLE_ORDER = ['MINER', 'BUILDER', 'EXPLORER'] as const;

export type DroneRole = (typeof DRONE_ROLE_ORDER)[number];
export type DroneRoleTargets = Record<DroneRole, number>;

export interface DroneRoleAllocation {
  manual: DroneRoleTargets;
  auto: DroneRoleTargets;
  effective: DroneRoleTargets;
  totalDrones: number;
  manualTotal: number;
  autoTotal: number;
  unassigned: number;
}

export const createEmptyDroneRoleTargets = (): DroneRoleTargets => ({
  MINER: 0,
  BUILDER: 0,
  EXPLORER: 0,
});

export const sumDroneRoleTargets = (targets: DroneRoleTargets): number =>
  DRONE_ROLE_ORDER.reduce((total, role) => total + targets[role], 0);

export const normalizeManualDroneRoleTargets = (
  targets: Partial<DroneRoleTargets>,
  totalDrones: number,
): DroneRoleTargets => {
  const normalized = createEmptyDroneRoleTargets();
  const clampedTotal = Math.max(0, Math.floor(totalDrones));
  let remaining = clampedTotal;

  for (const role of DRONE_ROLE_ORDER) {
    const requested = Math.max(0, Math.floor(targets[role] ?? 0));
    const capped = Math.min(requested, remaining);
    normalized[role] = capped;
    remaining -= capped;
  }

  return normalized;
};

export const computeDroneRoleAllocation = (
  totalDrones: number,
  manualTargets: Partial<DroneRoleTargets>,
): DroneRoleAllocation => {
  const clampedTotal = Math.max(0, Math.floor(totalDrones));
  const manual = normalizeManualDroneRoleTargets(manualTargets, clampedTotal);
  const manualTotal = sumDroneRoleTargets(manual);
  const unassigned = Math.max(0, clampedTotal - manualTotal);
  const auto = createEmptyDroneRoleTargets();
  const evenShare = Math.floor(unassigned / DRONE_ROLE_ORDER.length);

  for (const role of DRONE_ROLE_ORDER) {
    auto[role] = evenShare;
  }

  const remainder = unassigned % DRONE_ROLE_ORDER.length;
  for (let index = 0; index < remainder; index += 1) {
    auto[DRONE_ROLE_ORDER[index]] += 1;
  }

  const effective = createEmptyDroneRoleTargets();
  for (const role of DRONE_ROLE_ORDER) {
    effective[role] = manual[role] + auto[role];
  }

  return {
    manual,
    auto,
    effective,
    totalDrones: clampedTotal,
    manualTotal,
    autoTotal: sumDroneRoleTargets(auto),
    unassigned,
  };
};

export const adjustManualDroneRoleTarget = (
  manualTargets: Partial<DroneRoleTargets>,
  totalDrones: number,
  role: DroneRole,
  delta: 1 | -1,
): DroneRoleTargets => {
  const next = normalizeManualDroneRoleTargets(manualTargets, totalDrones);

  if (delta < 0) {
    next[role] = Math.max(0, next[role] - 1);
    return next;
  }

  if (sumDroneRoleTargets(next) >= Math.max(0, Math.floor(totalDrones))) {
    return next;
  }

  next[role] += 1;
  return next;
};