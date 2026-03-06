export const LCG_MULTIPLIER = 1664525;
export const LCG_INCREMENT = 1013904223;
export const LCG_MASK = 0x7fffffff;

export const nextSystemSeed = (seed: number): number =>
  (seed * LCG_MULTIPLIER + LCG_INCREMENT) & LCG_MASK;

export const createLcgRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) >>> 0;
    return state / 0x100000000;
  };
};
