import { useStore } from '../../state/store';

let lastTick = 0;

export const EnergySystem = (time: number) => {
  if (time - lastTick >= 1.0) {
    lastTick = time;
    
    // Increment energy based on rate
    const state = useStore.getState();
    if (state.energyGenerationRate > 0) {
        state.addEnergy(state.energyGenerationRate);
    }
  }
};
