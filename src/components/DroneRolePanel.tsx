import React from 'react';
import { useStore } from '../state/store';
import {
  computeDroneRoleAllocation,
  createEmptyDroneRoleTargets,
  DRONE_ROLE_ORDER,
  DroneRole,
} from '../utils/droneRoles';

const ROLE_STYLES: Record<DroneRole, { label: string; accent: string; accentText: string }> = {
  MINER: {
    label: 'Miner',
    accent: 'border-amber-400/30 bg-amber-500/10',
    accentText: 'text-amber-300',
  },
  BUILDER: {
    label: 'Builder',
    accent: 'border-cyan-400/30 bg-cyan-500/10',
    accentText: 'text-cyan-300',
  },
  EXPLORER: {
    label: 'Explorer',
    accent: 'border-teal-400/30 bg-teal-500/10',
    accentText: 'text-teal-300',
  },
};

export const DroneRolePanel = () => {
  const droneCount = useStore((state) => state.droneCount);
  const manualTargets = useStore((state) => state.manualDroneRoleTargets);
  const adjustDroneRoleTarget = useStore((state) => state.adjustDroneRoleTarget);
  const allocation = computeDroneRoleAllocation(droneCount, manualTargets ?? createEmptyDroneRoleTargets());

  return (
    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 p-4 shadow-[0_0_25px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Swarm Roles</div>
          <div className="font-mono text-sm text-white">Manual targets + automatic balancing</div>
        </div>
        <div className="text-right text-[11px] font-mono text-gray-400">
          <div>Total {allocation.totalDrones}</div>
          <div>Auto pool {allocation.unassigned}</div>
        </div>
      </div>

      <div className="space-y-2">
        {DRONE_ROLE_ORDER.map((role) => {
          const style = ROLE_STYLES[role];
          const manual = allocation.manual[role];
          const auto = allocation.auto[role];
          const total = allocation.effective[role];

          return (
            <div
              key={role}
              data-testid={`drone-role-row-${role}`}
              className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border px-3 py-2 ${style.accent}`}
            >
              <div>
                <div className={`text-xs font-semibold uppercase tracking-[0.25em] ${style.accentText}`}>
                  {style.label}
                </div>
                <div className="text-xs text-gray-400">{manual} manual · {auto} auto</div>
              </div>

              <div className="text-right font-mono">
                <div className={`text-lg ${style.accentText}`}>{total} total</div>
              </div>

              <div className="flex items-center gap-2">
                <RoleAdjustButton
                  ariaLabel={`Decrease ${style.label.toLowerCase()} target`}
                  onClick={() => adjustDroneRoleTarget?.(role, -1)}
                >
                  −
                </RoleAdjustButton>
                <RoleAdjustButton
                  ariaLabel={`Increase ${style.label.toLowerCase()} target`}
                  onClick={() => adjustDroneRoleTarget?.(role, 1)}
                >
                  +
                </RoleAdjustButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type RoleAdjustButtonProps = {
  ariaLabel: string;
  children: React.ReactNode;
  onClick: () => void;
};

const RoleAdjustButton = ({ ariaLabel, children, onClick }: RoleAdjustButtonProps) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 font-mono text-lg text-white transition-all hover:border-white/30 hover:bg-white/20"
  >
    {children}
  </button>
);