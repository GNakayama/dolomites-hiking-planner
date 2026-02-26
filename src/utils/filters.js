/**
 * Filters combinations by minimum distance per day
 */
export function filterByMinDistance(combinations, minDistanceKm) {
  if (!minDistanceKm || minDistanceKm <= 0) return combinations;
  
  return combinations.filter((combo) =>
    combo.every((day) => day.totalDistanceKm >= minDistanceKm)
  );
}

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
 * Filters combinations by hut availability dates
 * @param {Array} combinations - Array of route combinations
 * @param {Object} hutAvailability - Object mapping hut names to arrays of available dates (YYYY-MM-DD)
 * @param {string} startDate - Start date of the trip (YYYY-MM-DD)
 * @returns {Array} Filtered combinations
 */
export function filterByHutAvailability(combinations, hutAvailability, startDate) {
  if (!hutAvailability || Object.keys(hutAvailability).length === 0) {
    return combinations; // No availability constraints
  }
  
  if (!startDate) {
    return combinations; // Can't check availability without start date
  }

  // Parse start date manually to avoid timezone issues
  // startDate is in YYYY-MM-DD format
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  
  return combinations.filter((combo) => {
    // Check each day in the combination
    return combo.every((day, dayIndex) => {
      const hut = day.hut;
      
      // Skip if hut is "End in valley" (no booking needed)
      if (hut === "End in valley") {
        return true;
      }
      
      // If no availability set for this hut, assume always available
      if (!hutAvailability[hut] || hutAvailability[hut].length === 0) {
        return true;
      }
      
      // Calculate which date this day falls on
      // Use UTC to avoid timezone shifts
      const dayDate = new Date(Date.UTC(startYear, startMonth - 1, startDay + dayIndex));
      const dateString = dayDate.toISOString().slice(0, 10); // YYYY-MM-DD
      
      // Check if this date is in the availability list
      return hutAvailability[hut].includes(dateString);
    });
  });
}

/**
 * Applies all filters to combinations
 */
export function applyFilters(combinations, filters) {
  let filtered = combinations;
  
  if (filters.minDistancePerDay) {
    const minDist = parseFloat(filters.minDistancePerDay);
    if (!Number.isNaN(minDist) && minDist > 0) {
      filtered = filterByMinDistance(filtered, minDist);
    }
  }
  
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
  
  // Filter by hut availability (requires startDate)
  if (filters.hutAvailability && filters.startDate) {
    filtered = filterByHutAvailability(filtered, filters.hutAvailability, filters.startDate);
  }
  
  return filtered;
}
