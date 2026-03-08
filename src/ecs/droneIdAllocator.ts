let nextDroneEntityId = 1;

export const getNextDroneEntityId = () => nextDroneEntityId++;

export const resetDroneEntityIdsForTests = () => {
  nextDroneEntityId = 1;
};