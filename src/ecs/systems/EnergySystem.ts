import { useStore } from '../../state/store';

let accumulatedTime = 0;

export const EnergySystem = (delta: number) => {
  accumulatedTime += delta;

  // Tick every second
  if (accumulatedTime >= 1.0) {
    accumulatedTime -= 1.0;

    // Increment energy based on rate
    const state = useStore.getState();
    if (state.energyGenerationRate > 0) {
      state.addEnergy(state.energyGenerationRate);
    }
  }
};
