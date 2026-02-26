/**
 * Formats a date string to a short format (e.g., "Mon, Jan 15")
 */
export function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Builds an itinerary from a selected combination and start date.
 */
export function buildItineraryFromCombination(startDate, combination) {
  const itinerary = [];
  const base = startDate ? new Date(startDate) : new Date();

  combination.forEach((day, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);

    // For display, we'll use the first stage as the representative
    // but show the combined distance and ascent
    const representativeStage = {
      ...day.stages[0],
      distanceKm: day.totalDistanceKm,
      ascentM: day.totalAscentM,
      to: day.to,
      hut: day.hut,
    };

    itinerary.push({
      dayIndex: index + 1,
      date: date.toISOString().slice(0, 10),
      stage: representativeStage,
      allStages: day.stages, // Keep all stages for detailed view
    });
  });

  return itinerary;
}
