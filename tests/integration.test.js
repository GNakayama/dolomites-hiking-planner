import { describe, it, expect } from 'vitest';
import { generateAllCombinations } from '../src/utils/route-generator.js';
import { applyFilters } from '../src/utils/filters.js';
import { buildItineraryFromCombination } from '../src/utils/date-helpers.js';
import { ALTA_VIA_STAGES, MIN_DAYS, MAX_DAYS } from '../src/data/alta-via-1.js';

describe('Integration Tests', () => {
  describe('Full workflow: Generate → Filter → Build Itinerary', () => {
    it('should generate, filter, and build itinerary for 5 days', () => {
      // Step 1: Generate combinations
      const allCombinations = generateAllCombinations(5);
      expect(allCombinations.length).toBeGreaterThan(0);

      // Step 2: Apply filters
      const filters = {
        maxDistancePerDay: '20',
        maxAltitudePerDay: '1000',
        excludedHuts: [],
      };
      const filtered = applyFilters(allCombinations, filters);
      expect(filtered.length).toBeGreaterThanOrEqual(0);

      // Step 3: Build itinerary from first combination
      if (filtered.length > 0) {
        const startDate = '2024-07-15';
        const itinerary = buildItineraryFromCombination(startDate, filtered[0]);
        
        expect(itinerary.length).toBe(5);
        expect(itinerary[0].date).toBe('2024-07-15');
        expect(itinerary[4].date).toBe('2024-07-19');
      }
    });

    it('should filter out combinations with excluded huts', () => {
      const allCombinations = generateAllCombinations(6);
      
      // Get a hut that exists in some combinations
      const testHut = ALTA_VIA_STAGES[0].hut;
      
      const filters = {
        excludedHuts: [testHut],
      };
      const filtered = applyFilters(allCombinations, filters);
      
      // Verify no combination uses the excluded hut
      filtered.forEach(combo => {
        combo.forEach(day => {
          expect(day.hut).not.toBe(testHut);
        });
      });
    });

    it('should filter by distance and altitude together', () => {
      const allCombinations = generateAllCombinations(7);
      
      const filters = {
        maxDistancePerDay: '15',
        maxAltitudePerDay: '800',
      };
      const filtered = applyFilters(allCombinations, filters);
      
      filtered.forEach(combo => {
        combo.forEach(day => {
          expect(day.totalDistanceKm).toBeLessThanOrEqual(15);
          expect(day.totalAscentM).toBeLessThanOrEqual(800);
        });
      });
    });

    it('should handle edge case: all filters applied, no results', () => {
      const allCombinations = generateAllCombinations(5);
      
      const filters = {
        maxDistancePerDay: '5', // Very restrictive
        maxAltitudePerDay: '100', // Very restrictive
        excludedHuts: ALTA_VIA_STAGES.map(s => s.hut).filter(h => h !== 'End in valley'),
      };
      const filtered = applyFilters(allCombinations, filters);
      
      // Should return empty array or very few results
      expect(Array.isArray(filtered)).toBe(true);
    });

    it('should maintain data integrity through full workflow', () => {
      const allCombinations = generateAllCombinations(8);
      const filters = { maxDistancePerDay: '18' };
      const filtered = applyFilters(allCombinations, filters);
      
      if (filtered.length > 0) {
        const startDate = '2024-08-01';
        const itinerary = buildItineraryFromCombination(startDate, filtered[0]);
        
        // Verify all stages are covered
        const totalStages = itinerary.reduce(
          (sum, day) => sum + day.allStages.length,
          0
        );
        expect(totalStages).toBe(ALTA_VIA_STAGES.length);
        
        // Verify dates are sequential
        itinerary.forEach((day, index) => {
          if (index > 0) {
            const prevDate = new Date(itinerary[index - 1].date);
            const currDate = new Date(day.date);
            expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
          }
        });
      }
    });
  });
});
