import { ALTA_VIA_STAGES } from '../data/alta-via-1.js';

/**
 * Creates a day object from an array of consecutive stages.
 */
function createDayFromStages(stages) {
  if (stages.length === 0) return null;

  const totalDistanceKm = stages.reduce(
    (sum, stage) => sum + stage.distanceKm,
    0
  );
  const totalAscentM = stages.reduce(
    (sum, stage) => sum + stage.ascentM,
    0
  );

  const firstStage = stages[0];
  const lastStage = stages[stages.length - 1];

  return {
    stages: stages,
    from: firstStage.from,
    to: lastStage.to,
    hut: lastStage.hut,
    totalDistanceKm: totalDistanceKm,
    totalAscentM: totalAscentM,
  };
}

/**
 * Generates all possible ways to complete Alta Via 1 in numDays.
 * Always goes from start (Lago di Braies) to finish (Belluno).
 * Returns an array of combinations, where each combination is an array of days.
 */
export function generateAllCombinations(numDays) {
  const totalStages = ALTA_VIA_STAGES.length;
  const combinations = [];

  // We need to partition totalStages into numDays groups
  // This is equivalent to finding all ways to place (numDays - 1) breaks
  // between the stages
  function findPartitions(stagesLeft, daysLeft, currentPartition) {
    if (daysLeft === 1) {
      // Last day: take all remaining stages
      const dayStages = ALTA_VIA_STAGES.slice(
        totalStages - stagesLeft,
        totalStages
      );
      const day = createDayFromStages(dayStages);
      const newPartition = [...currentPartition, day];
      combinations.push(newPartition);
      return;
    }

    // For each possible number of stages for the current day
    // (at least 1, at most stagesLeft - daysLeft + 1)
    const minStages = 1;
    const maxStages = stagesLeft - daysLeft + 1;

    for (let stagesToday = minStages; stagesToday <= maxStages; stagesToday += 1) {
      const dayStages = ALTA_VIA_STAGES.slice(
        totalStages - stagesLeft,
        totalStages - stagesLeft + stagesToday
      );
      const day = createDayFromStages(dayStages);
      findPartitions(
        stagesLeft - stagesToday,
        daysLeft - 1,
        [...currentPartition, day]
      );
    }
  }

  findPartitions(totalStages, numDays, []);
  return combinations;
}
