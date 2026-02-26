import { describe, it, expect } from 'vitest';
import {
  filterByMaxDistance,
  filterByMaxAltitude,
  filterByExcludedHuts,
  applyFilters,
} from '../src/utils/filters.js';

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

    it('should apply distance filter', () => {
      const filters = { maxDistancePerDay: '15' };
      const result = applyFilters(mockCombinations, filters);
      
      expect(result.length).toBe(2);
      expect(result).not.toContain(mockCombinations[1]);
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
});
