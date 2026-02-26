/**
 * Filters combinations by maximum distance per day
 */
export function filterByMaxDistance(combinations, maxDistanceKm) {
  if (!maxDistanceKm || maxDistanceKm <= 0) return combinations;
  
  return combinations.filter((combo) =>
    combo.every((day) => day.totalDistanceKm <= maxDistanceKm)
  );
}

/**
 * Filters combinations by maximum ascent per day
 */
export function filterByMaxAltitude(combinations, maxAltitudeM) {
  if (!maxAltitudeM || maxAltitudeM <= 0) return combinations;
  
  return combinations.filter((combo) =>
    combo.every((day) => day.totalAscentM <= maxAltitudeM)
  );
}

/**
 * Filters combinations by excluded huts
 */
export function filterByExcludedHuts(combinations, excludedHuts) {
  if (!excludedHuts || excludedHuts.length === 0) return combinations;
  
  return combinations.filter((combo) =>
    combo.every((day) => !excludedHuts.includes(day.hut))
  );
}

/**
 * Applies all filters to combinations
 */
export function applyFilters(combinations, filters) {
  let filtered = combinations;
  
  if (filters.maxDistancePerDay) {
    const maxDist = parseFloat(filters.maxDistancePerDay);
    if (!Number.isNaN(maxDist) && maxDist > 0) {
      filtered = filterByMaxDistance(filtered, maxDist);
    }
  }
  
  if (filters.maxAltitudePerDay) {
    const maxAlt = parseFloat(filters.maxAltitudePerDay);
    if (!Number.isNaN(maxAlt) && maxAlt > 0) {
      filtered = filterByMaxAltitude(filtered, maxAlt);
    }
  }
  
  if (filters.excludedHuts && filters.excludedHuts.length > 0) {
    filtered = filterByExcludedHuts(filtered, filters.excludedHuts);
  }
  
  return filtered;
}
