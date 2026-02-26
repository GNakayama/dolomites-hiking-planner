import { describe, it, expect } from 'vitest';
import { formatShortDate, buildItineraryFromCombination } from '../src/utils/date-helpers.js';

describe('Date Helpers', () => {
  describe('formatShortDate', () => {
    it('should return empty string for null or undefined', () => {
      expect(formatShortDate(null)).toBe('');
      expect(formatShortDate(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(formatShortDate('')).toBe('');
    });

    it('should format valid date string', () => {
      const date = '2024-07-15';
      const result = formatShortDate(date);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle ISO date format', () => {
      const date = '2024-07-15T00:00:00.000Z';
      const result = formatShortDate(date);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return original value for invalid date', () => {
      const invalid = 'not-a-date';
      const result = formatShortDate(invalid);
      
      expect(result).toBe(invalid);
    });

    it('should format dates consistently', () => {
      const date1 = '2024-07-15';
      const date2 = '2024-07-15';
      
      expect(formatShortDate(date1)).toBe(formatShortDate(date2));
    });
  });

  describe('buildItineraryFromCombination', () => {
    const mockCombination = [
      {
        stages: [
          { id: 1, from: 'Start', to: 'Middle', distanceKm: 10, ascentM: 500, hut: 'Hut A' },
        ],
        totalDistanceKm: 10,
        totalAscentM: 500,
        from: 'Start',
        to: 'Middle',
        hut: 'Hut A',
      },
      {
        stages: [
          { id: 2, from: 'Middle', to: 'End', distanceKm: 12, ascentM: 600, hut: 'Hut B' },
        ],
        totalDistanceKm: 12,
        totalAscentM: 600,
        from: 'Middle',
        to: 'End',
        hut: 'Hut B',
      },
    ];

    it('should build itinerary with correct number of days', () => {
      const startDate = '2024-07-15';
      const result = buildItineraryFromCombination(startDate, mockCombination);
      
      expect(result.length).toBe(mockCombination.length);
    });

    it('should assign correct day indices', () => {
      const startDate = '2024-07-15';
      const result = buildItineraryFromCombination(startDate, mockCombination);
      
      result.forEach((day, index) => {
        expect(day.dayIndex).toBe(index + 1);
      });
    });

    it('should calculate dates correctly', () => {
      const startDate = '2024-07-15';
      const result = buildItineraryFromCombination(startDate, mockCombination);
      
      expect(result[0].date).toBe('2024-07-15');
      expect(result[1].date).toBe('2024-07-16');
    });

    it('should use current date when startDate is not provided', () => {
      const result = buildItineraryFromCombination('', mockCombination);
      
      expect(result.length).toBe(mockCombination.length);
      expect(result[0].date).toBeTruthy();
    });

    it('should include all stages in each day', () => {
      const startDate = '2024-07-15';
      const result = buildItineraryFromCombination(startDate, mockCombination);
      
      result.forEach((day, index) => {
        expect(day.allStages).toEqual(mockCombination[index].stages);
      });
    });

    it('should set correct distance and ascent from combination', () => {
      const startDate = '2024-07-15';
      const result = buildItineraryFromCombination(startDate, mockCombination);
      
      result.forEach((day, index) => {
        expect(day.stage.distanceKm).toBe(mockCombination[index].totalDistanceKm);
        expect(day.stage.ascentM).toBe(mockCombination[index].totalAscentM);
      });
    });

    it('should set correct hut from combination', () => {
      const startDate = '2024-07-15';
      const result = buildItineraryFromCombination(startDate, mockCombination);
      
      result.forEach((day, index) => {
        expect(day.stage.hut).toBe(mockCombination[index].hut);
      });
    });

    it('should handle multi-day combinations', () => {
      const multiDayCombination = [
        ...mockCombination,
        {
          stages: [
            { id: 3, from: 'End', to: 'Final', distanceKm: 8, ascentM: 400, hut: 'Hut C' },
          ],
          totalDistanceKm: 8,
          totalAscentM: 400,
          from: 'End',
          to: 'Final',
          hut: 'Hut C',
        },
      ];
      
      const startDate = '2024-07-15';
      const result = buildItineraryFromCombination(startDate, multiDayCombination);
      
      expect(result.length).toBe(3);
      expect(result[0].date).toBe('2024-07-15');
      expect(result[1].date).toBe('2024-07-16');
      expect(result[2].date).toBe('2024-07-17');
    });
  });
});
