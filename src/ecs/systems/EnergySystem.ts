import { useStore } from '../../state/store';

let accumulatedTime = 0;

export const EnergySystem = (delta: number) => {
  accumulatedTime += delta;

  // Tick every second; process catch-up ticks for large frame deltas batched.
  if (accumulatedTime >= 1.0) {
    const ticks = Math.floor(accumulatedTime);
    accumulatedTime -= ticks;

    const state = useStore.getState();

    // Batch energy increment
    if (state.energyGenerationRate > 0) {
      state.addEnergy(state.energyGenerationRate * ticks);
    }

    // Auto-Replicator: auto-purchase a drone once per second when matter is sufficient
    if (
      state.upgrades['AUTO_REPLICATOR'] &&
      state.autoReplicatorEnabled &&
      state.matter >= state.droneCost
    ) {
        let { matter, droneCount, droneCost } = state;
        let addedCount = 0;

        for (let i = 0; i < ticks; i++) {
            if (matter >= droneCost) {
                matter -= droneCost;
                droneCount += 1;
                droneCost += 10;
                addedCount++;
            } else {
                break;
            }
        }

        if (addedCount > 0) {
            useStore.setState({ matter, droneCount, droneCost });
        }
    }
  }
};
