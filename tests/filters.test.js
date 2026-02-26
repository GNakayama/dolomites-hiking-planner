import { describe, it, expect } from 'vitest';
import {
  filterByMinDistance,
  filterByMaxDistance,
  filterByMaxAltitude,
  filterByExcludedHuts,
  filterByHutAvailability,
  applyFilters,
} from '../src/utils/filters.js';
import { buildItineraryFromCombination } from '../src/utils/date-helpers.js';

describe('Filters', () => {
  // Mock combination data for testing
  const mockCombinations = [
    [
      { totalDistanceKm: 15, totalAscentM: 800, hut: 'Rifugio A' },
      { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B' },
    ],
    [
      { totalDistanceKm: 20, totalAscentM: 900, hut: 'Rifugio A' },
      { totalDistanceKm: 18, totalAscentM: 700, hut: 'Rifugio C' },
    ],
    [
      { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio B' },
      { totalDistanceKm: 11, totalAscentM: 550, hut: 'Rifugio C' },
    ],
  ];

  describe('filterByMinDistance', () => {
    it('should return all combinations when minDistance is not provided', () => {
      const result = filterByMinDistance(mockCombinations, null);
      expect(result).toEqual(mockCombinations);
    });

    it('should return all combinations when minDistance is 0 or negative', () => {
      expect(filterByMinDistance(mockCombinations, 0)).toEqual(mockCombinations);
      expect(filterByMinDistance(mockCombinations, -10)).toEqual(mockCombinations);
    });

    it('should filter out combinations below minimum distance', () => {
      const result = filterByMinDistance(mockCombinations, 12);
      
      // First combination has 15,12 (both >= 12) - passes
      // Second combination has 20,18 (both >= 12) - passes
      // Third combination has 10,11 (both < 12) - filtered
      expect(result.length).toBe(2);
      expect(result).not.toContain(mockCombinations[2]);
    });

    it('should filter based on all days in combination', () => {
      const result = filterByMinDistance(mockCombinations, 15);
      
      // First combination has 15,12 (12 < 15) - filtered
      // Second combination has 20,18 (both >= 15) - passes
      // Third combination has 10,11 (both < 15) - filtered
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[1]);
    });

    it('should return empty array if no combinations meet minimum', () => {
      const result = filterByMinDistance(mockCombinations, 25);
      expect(result).toEqual([]);
    });
  });

  describe('filterByMaxDistance', () => {
    it('should return all combinations when maxDistance is not provided', () => {
      const result = filterByMaxDistance(mockCombinations, null);
      expect(result).toEqual(mockCombinations);
    });

    it('should return all combinations when maxDistance is 0 or negative', () => {
      expect(filterByMaxDistance(mockCombinations, 0)).toEqual(mockCombinations);
      expect(filterByMaxDistance(mockCombinations, -10)).toEqual(mockCombinations);
    });

    it('should filter out combinations exceeding max distance', () => {
      const result = filterByMaxDistance(mockCombinations, 15);
      
      // First and third combinations should pass (all days <= 15)
      // Second combination should be filtered (has 20km day)
      expect(result.length).toBe(2);
      expect(result).not.toContain(mockCombinations[1]);
    });

    it('should filter based on all days in combination', () => {
      const result = filterByMaxDistance(mockCombinations, 12);
      
      // Only third combination should pass (all days <= 12)
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[2]);
    });

    it('should return empty array if no combinations meet criteria', () => {
      const result = filterByMaxDistance(mockCombinations, 5);
      expect(result).toEqual([]);
    });
  });

  describe('filterByMaxAltitude', () => {
    it('should return all combinations when maxAltitude is not provided', () => {
      const result = filterByMaxAltitude(mockCombinations, null);
      expect(result).toEqual(mockCombinations);
    });

    it('should return all combinations when maxAltitude is 0 or negative', () => {
      expect(filterByMaxAltitude(mockCombinations, 0)).toEqual(mockCombinations);
      expect(filterByMaxAltitude(mockCombinations, -100)).toEqual(mockCombinations);
    });

    it('should filter out combinations exceeding max altitude', () => {
      const result = filterByMaxAltitude(mockCombinations, 700);
      
      // First combination has 800m (exceeds 700), second has 900m (exceeds 700)
      // Only third combination should pass (all days <= 700: 500m and 550m)
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[2]);
    });

    it('should filter based on all days in combination', () => {
      const result = filterByMaxAltitude(mockCombinations, 600);
      
      // Only third combination should pass (all days <= 600)
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[2]);
    });
  });

  describe('filterByExcludedHuts', () => {
    it('should return all combinations when no huts are excluded', () => {
      const result = filterByExcludedHuts(mockCombinations, []);
      expect(result).toEqual(mockCombinations);
    });

    it('should return all combinations when excludedHuts is null or undefined', () => {
      expect(filterByExcludedHuts(mockCombinations, null)).toEqual(mockCombinations);
      expect(filterByExcludedHuts(mockCombinations, undefined)).toEqual(mockCombinations);
    });

    it('should filter out combinations using excluded huts', () => {
      const result = filterByExcludedHuts(mockCombinations, ['Rifugio A']);
      
      // First and second combinations use Rifugio A, should be filtered
      // Third combination should pass
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[2]);
    });

    it('should filter based on all days in combination', () => {
      const result = filterByExcludedHuts(mockCombinations, ['Rifugio B']);
      
      // First and third combinations use Rifugio B, should be filtered
      // Second combination should pass
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[1]);
    });

    it('should handle multiple excluded huts', () => {
      const result = filterByExcludedHuts(mockCombinations, ['Rifugio A', 'Rifugio B']);
      
      // All combinations use either A or B, should all be filtered
      expect(result).toEqual([]);
    });
  });

  describe('applyFilters', () => {
    it('should return all combinations when no filters are provided', () => {
      const result = applyFilters(mockCombinations, {});
      expect(result).toEqual(mockCombinations);
    });

    it('should apply minimum distance filter', () => {
      const filters = { minDistancePerDay: '12' };
      const result = applyFilters(mockCombinations, filters);
      
      // First and second combinations pass (all days >= 12)
      // Third combination filtered (has days < 12)
      expect(result.length).toBe(2);
      expect(result).not.toContain(mockCombinations[2]);
    });

    it('should apply maximum distance filter', () => {
      const filters = { maxDistancePerDay: '15' };
      const result = applyFilters(mockCombinations, filters);
      
      expect(result.length).toBe(2);
      expect(result).not.toContain(mockCombinations[1]);
    });

    it('should apply both min and max distance filters', () => {
      const filters = { minDistancePerDay: '12', maxDistancePerDay: '15' };
      const result = applyFilters(mockCombinations, filters);
      
      // First combination: 15,12 (both between 12-15) - passes
      // Second combination: 20,18 (both > 15) - filtered
      // Third combination: 10,11 (both < 12) - filtered
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[0]);
    });

    it('should apply altitude filter', () => {
      const filters = { maxAltitudePerDay: '700' };
      const result = applyFilters(mockCombinations, filters);
      
      // First combination has 800m (exceeds 700), second has 900m (exceeds 700)
      // Only third combination should pass (all days <= 700: 500m and 550m)
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[2]);
    });

    it('should apply excluded huts filter', () => {
      const filters = { excludedHuts: ['Rifugio A'] };
      const result = applyFilters(mockCombinations, filters);
      
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[2]);
    });

    it('should apply all filters together', () => {
      const filters = {
        maxDistancePerDay: '15',
        maxAltitudePerDay: '700',
        excludedHuts: ['Rifugio B'],
      };
      const result = applyFilters(mockCombinations, filters);
      
      // First combination: distance 15,12 (pass), altitude 800,600 (800 > 700, fails), hut B (excluded, fails) - FILTERED
      // Second combination: distance 20,18 (both > 15, fails) - FILTERED
      // Third combination: distance 10,11 (pass), altitude 500,550 (pass), hut B,C (B excluded, fails) - FILTERED
      // All should be filtered out
      expect(result.length).toBe(0);
    });

    it('should handle invalid filter values gracefully', () => {
      const filters = {
        maxDistancePerDay: 'invalid',
        maxAltitudePerDay: 'not-a-number',
      };
      const result = applyFilters(mockCombinations, filters);
      
      // Should return all combinations since filters are invalid
      expect(result).toEqual(mockCombinations);
    });

    it('should apply hut availability filter', () => {
      const filters = {
        hutAvailability: {
          'Rifugio A': ['2024-07-01', '2024-07-02'],
        },
        startDate: '2024-07-01',
      };
      const result = applyFilters(mockCombinations, filters);
      
      // First combination: Day 0 (2024-07-01) uses Rifugio A (available) ✓
      // Second combination: Day 0 (2024-07-01) uses Rifugio A (available) ✓
      // Third combination: Day 0 (2024-07-01) uses Rifugio B (no availability set, assumed available) ✓
      // All should pass
      expect(result.length).toBe(3);
    });

    it('should filter out combinations with unavailable huts', () => {
      const filters = {
        hutAvailability: {
          'Rifugio A': ['2024-07-02'], // Only available on day 2
        },
        startDate: '2024-07-01',
      };
      const result = applyFilters(mockCombinations, filters);
      
      // First combination: Day 0 (2024-07-01) uses Rifugio A (not available on 2024-07-01) ✗
      // Second combination: Day 0 (2024-07-01) uses Rifugio A (not available on 2024-07-01) ✗
      // Third combination: Day 0 (2024-07-01) uses Rifugio B (no availability set, assumed available) ✓
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombinations[2]);
    });

    it('should handle multiple huts with availability', () => {
      const filters = {
        hutAvailability: {
          'Rifugio A': ['2024-07-01'],
          'Rifugio B': ['2024-07-02'],
        },
        startDate: '2024-07-01',
      };
      const result = applyFilters(mockCombinations, filters);
      
      // First combination: Day 0 (2024-07-01) Rifugio A (available), Day 1 (2024-07-02) Rifugio B (available) ✓
      // Second combination: Day 0 (2024-07-01) Rifugio A (available), Day 1 (2024-07-02) Rifugio C (no availability set) ✓
      // Third combination: Day 0 (2024-07-01) Rifugio B (not available on 2024-07-01) ✗
      expect(result.length).toBe(2);
    });

    it('should skip availability check for "End in valley"', () => {
      const comboWithValley = [
        {
          stages: [],
          totalDistanceKm: 10,
          totalAscentM: 500,
          to: 'Belluno',
          hut: 'End in valley',
        },
      ];
      const filters = {
        hutAvailability: {},
        startDate: '2024-07-01',
      };
      const result = filterByHutAvailability([comboWithValley], filters.hutAvailability, filters.startDate);
      expect(result.length).toBe(1);
    });

    it('should assume always available if no availability set for a hut', () => {
      const filters = {
        hutAvailability: {
          'Rifugio X': ['2024-07-01'], // Different hut
        },
        startDate: '2024-07-01',
      };
      const result = applyFilters(mockCombinations, filters);
      
      // All combinations should pass since Rifugio A, B, C have no availability constraints
      expect(result.length).toBe(3);
    });

    it('should return all combinations if no availability data provided', () => {
      const filters = {
        startDate: '2024-07-01',
      };
      const result = applyFilters(mockCombinations, filters);
      expect(result.length).toBe(3);
    });

    it('should return all combinations if no startDate provided', () => {
      const filters = {
        hutAvailability: {
          'Rifugio A': ['2024-07-01'],
        },
      };
      const result = applyFilters(mockCombinations, filters);
      // Without startDate, can't check availability, so all pass
      expect(result.length).toBe(3);
    });

    it('should handle empty string filter values', () => {
      const filters = {
        maxDistancePerDay: '',
        maxAltitudePerDay: '',
        excludedHuts: [],
      };
      const result = applyFilters(mockCombinations, filters);
      
      expect(result).toEqual(mockCombinations);
    });
  });

  describe('filterByHutAvailability - Date Calculation Bug Tests', () => {
    // Create mock combinations with specific huts for each day
    const mockCombosWithHuts = [
      // Combo 1: Day 0 = Rifugio A, Day 1 = Rifugio B
      [
        { totalDistanceKm: 15, totalAscentM: 800, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B', stages: [] },
      ],
      // Combo 2: Day 0 = Rifugio A, Day 1 = Rifugio C
      [
        { totalDistanceKm: 20, totalAscentM: 900, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 18, totalAscentM: 700, hut: 'Rifugio C', stages: [] },
      ],
      // Combo 3: Day 0 = Rifugio B, Day 1 = Rifugio C
      [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio B', stages: [] },
        { totalDistanceKm: 11, totalAscentM: 550, hut: 'Rifugio C', stages: [] },
      ],
    ];

    it('should calculate dates correctly for day 0 and day 1', () => {
      // Start: 2024-07-01
      // Day 0 should be 2024-07-01, Day 1 should be 2024-07-02
      const availability = {
        'Rifugio A': ['2024-07-01'],
        'Rifugio B': ['2024-07-02'],
      };
      const result = filterByHutAvailability(mockCombosWithHuts, availability, '2024-07-01');
      
      // Verify by building itinerary and checking dates match
      const combo1 = mockCombosWithHuts[0];
      const itinerary = buildItineraryFromCombination('2024-07-01', combo1);
      
      // Day 0 should be 2024-07-01
      expect(itinerary[0].date).toBe('2024-07-01');
      // Day 1 should be 2024-07-02
      expect(itinerary[1].date).toBe('2024-07-02');
      
      // Combo 1: Day 0 (2024-07-01) Rifugio A ✓, Day 1 (2024-07-02) Rifugio B ✓
      // Combo 2: Day 0 (2024-07-01) Rifugio A ✓, Day 1 (2024-07-02) Rifugio C (no constraint) ✓
      // Combo 3: Day 0 (2024-07-01) Rifugio B (not available) ✗
      expect(result.length).toBe(2);
      expect(result).toContainEqual(mockCombosWithHuts[0]);
      expect(result).toContainEqual(mockCombosWithHuts[1]);
      expect(result).not.toContainEqual(mockCombosWithHuts[2]);
    });

    it('should filter out combinations where hut is not available on the required day', () => {
      // Start: 2024-07-01
      // Day 0 (2024-07-01): Rifugio A should be available on 2024-07-01
      // But we set it to only be available on 2024-07-02
      const availability = {
        'Rifugio A': ['2024-07-02'], // Only available on day 1, not day 0
      };
      const result = filterByHutAvailability(mockCombosWithHuts, availability, '2024-07-01');
      
      // Combo 1: Day 0 (2024-07-01) Rifugio A (not available on 2024-07-01) ✗
      // Combo 2: Day 0 (2024-07-01) Rifugio A (not available on 2024-07-01) ✗
      // Combo 3: Day 0 (2024-07-01) Rifugio B (no constraint) ✓
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockCombosWithHuts[2]);
    });

    it('should handle multi-day trips correctly', () => {
      // 3-day trip starting 2024-07-01
      // Day 0 (2024-07-01), Day 1 (2024-07-02), Day 2 (2024-07-03)
      const threeDayCombo = [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B', stages: [] },
        { totalDistanceKm: 15, totalAscentM: 700, hut: 'Rifugio C', stages: [] },
      ];
      
      const availability = {
        'Rifugio A': ['2024-07-01'], // Available on day 0
        'Rifugio B': ['2024-07-02'], // Available on day 1
        'Rifugio C': ['2024-07-03'], // Available on day 2
      };
      
      // Verify dates match
      const itinerary = buildItineraryFromCombination('2024-07-01', threeDayCombo);
      expect(itinerary[0].date).toBe('2024-07-01');
      expect(itinerary[1].date).toBe('2024-07-02');
      expect(itinerary[2].date).toBe('2024-07-03');
      
      const result = filterByHutAvailability([threeDayCombo], availability, '2024-07-01');
      expect(result.length).toBe(1);
    });

    it('should filter out if any day has unavailable hut', () => {
      // 3-day trip, but Rifugio B is not available on day 1
      const threeDayCombo = [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B', stages: [] },
        { totalDistanceKm: 15, totalAscentM: 700, hut: 'Rifugio C', stages: [] },
      ];
      
      const availability = {
        'Rifugio A': ['2024-07-01'], // Available on day 0 ✓
        'Rifugio B': ['2024-07-03'], // Available on day 2, NOT day 1 ✗
        'Rifugio C': ['2024-07-03'], // Available on day 2 ✓
      };
      
      const result = filterByHutAvailability([threeDayCombo], availability, '2024-07-01');
      // Should be filtered out because Rifugio B is not available on day 1 (2024-07-02)
      expect(result.length).toBe(0);
    });

    it('should handle dates correctly across month boundaries', () => {
      // Start: 2024-07-31
      // Day 0 (2024-07-31), Day 1 (2024-08-01)
      const monthBoundaryCombo = [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B', stages: [] },
      ];
      
      const availability = {
        'Rifugio A': ['2024-07-31'],
        'Rifugio B': ['2024-08-01'],
      };
      
      // Verify dates
      const itinerary = buildItineraryFromCombination('2024-07-31', monthBoundaryCombo);
      expect(itinerary[0].date).toBe('2024-07-31');
      expect(itinerary[1].date).toBe('2024-08-01');
      
      const result = filterByHutAvailability([monthBoundaryCombo], availability, '2024-07-31');
      expect(result.length).toBe(1);
    });

    it('should handle dates correctly across year boundaries', () => {
      // Start: 2024-12-31
      // Day 0 (2024-12-31), Day 1 (2025-01-01)
      const yearBoundaryCombo = [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B', stages: [] },
      ];
      
      const availability = {
        'Rifugio A': ['2024-12-31'],
        'Rifugio B': ['2025-01-01'],
      };
      
      // Verify dates
      const itinerary = buildItineraryFromCombination('2024-12-31', yearBoundaryCombo);
      expect(itinerary[0].date).toBe('2024-12-31');
      expect(itinerary[1].date).toBe('2025-01-01');
      
      const result = filterByHutAvailability([yearBoundaryCombo], availability, '2024-12-31');
      expect(result.length).toBe(1);
    });

    it('should match dates exactly using YYYY-MM-DD format', () => {
      const combo = [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio A', stages: [] },
      ];
      
      // Test that the date string format matches exactly
      const availability = {
        'Rifugio A': ['2024-07-01'], // YYYY-MM-DD format
      };
      
      const result = filterByHutAvailability([combo], availability, '2024-07-01');
      expect(result.length).toBe(1);
    });

    it('should handle timezone issues correctly - dates should match between filter and itinerary', () => {
      // This test ensures that the dates calculated in the filter match
      // the dates calculated in buildItineraryFromCombination
      // This is critical to avoid bugs where routes pass the filter but
      // show incorrect dates in the UI
      const combo = [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B', stages: [] },
        { totalDistanceKm: 15, totalAscentM: 700, hut: 'Rifugio C', stages: [] },
      ];
      
      // Build itinerary to see what dates are actually used
      const itinerary = buildItineraryFromCombination('2024-07-01', combo);
      expect(itinerary[0].date).toBe('2024-07-01');
      expect(itinerary[1].date).toBe('2024-07-02');
      expect(itinerary[2].date).toBe('2024-07-03');
      
      // Now set availability to match those exact dates
      const availability = {
        'Rifugio A': [itinerary[0].date], // Use the date from itinerary
        'Rifugio B': [itinerary[1].date], // Use the date from itinerary
        'Rifugio C': [itinerary[2].date], // Use the date from itinerary
      };
      
      // Filter should pass because dates match
      const result = filterByHutAvailability([combo], availability, '2024-07-01');
      expect(result.length).toBe(1);
      
      // If we use wrong dates, it should filter out
      const wrongAvailability = {
        'Rifugio A': ['2024-07-02'], // Wrong date for day 0
      };
      const result2 = filterByHutAvailability([combo], wrongAvailability, '2024-07-01');
      expect(result2.length).toBe(0);
    });

    it('should be consistent with buildItineraryFromCombination date calculation', () => {
      // This is the critical test - ensure filter and itinerary builder use same logic
      const combo = [
        { totalDistanceKm: 10, totalAscentM: 500, hut: 'Rifugio A', stages: [] },
        { totalDistanceKm: 12, totalAscentM: 600, hut: 'Rifugio B', stages: [] },
      ];
      
      const startDate = '2024-07-15';
      const itinerary = buildItineraryFromCombination(startDate, combo);
      
      // Filter should use the same dates that itinerary builder calculates
      const availability = {
        'Rifugio A': [itinerary[0].date],
        'Rifugio B': [itinerary[1].date],
      };
      
      const result = filterByHutAvailability([combo], availability, startDate);
      expect(result.length).toBe(1);
      
      // Verify the dates are what we expect
      expect(itinerary[0].date).toBe('2024-07-15');
      expect(itinerary[1].date).toBe('2024-07-16');
    });
  });
});
