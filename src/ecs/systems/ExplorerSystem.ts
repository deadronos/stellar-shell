import { ECS } from '../world';
import { useStore } from '../../state/store';

/** Research units generated per exploring drone per second (base rate). */
export const RESEARCH_RATE = 0.5;

let researchAccumulator = 0;

export const ExplorerSystem = (delta: number) => {
  const store = useStore.getState();
  const allDrones = ECS.with('isDrone', 'state');

  let exploringCount = 0;
  for (const d of allDrones) {
    if (d.state === 'EXPLORING') exploringCount++;
  }

  const multiplier = store.upgrades['ADVANCED_EXPLORER'] ? 2 : 1;
  researchAccumulator += exploringCount * RESEARCH_RATE * multiplier * delta;

  if (researchAccumulator >= 1) {
    const toAdd = Math.floor(researchAccumulator);
    researchAccumulator -= toAdd;
    store.addResearch(toAdd);
  }
};
