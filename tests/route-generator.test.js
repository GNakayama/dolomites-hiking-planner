import { describe, it, expect } from 'vitest';
import { generateAllCombinations } from '../src/utils/route-generator.js';
import { ALTA_VIA_STAGES, MIN_DAYS, MAX_DAYS } from '../src/data/alta-via-1.js';

describe('Route Generator', () => {
  describe('generateAllCombinations', () => {
    it('should generate combinations for minimum days', () => {
      const combinations = generateAllCombinations(MIN_DAYS);
      
      expect(combinations).toBeDefined();
      expect(Array.isArray(combinations)).toBe(true);
      expect(combinations.length).toBeGreaterThan(0);
    });

    it('should generate combinations for maximum days', () => {
      const combinations = generateAllCombinations(MAX_DAYS);
      
      expect(combinations).toBeDefined();
      expect(Array.isArray(combinations)).toBe(true);
      expect(combinations.length).toBeGreaterThan(0);
    });

    it('should generate exactly one combination when days equals stages', () => {
      const combinations = generateAllCombinations(ALTA_VIA_STAGES.length);
      
      expect(combinations.length).toBe(1);
      expect(combinations[0].length).toBe(ALTA_VIA_STAGES.length);
    });

    it('should generate multiple combinations for fewer days than stages', () => {
      const combinations = generateAllCombinations(5);
      
      expect(combinations.length).toBeGreaterThan(1);
      // Each combination should have exactly 5 days
      combinations.forEach(combo => {
        expect(combo.length).toBe(5);
      });
    });

    it('should cover all stages in every combination', () => {
      const combinations = generateAllCombinations(8);
      
      combinations.forEach(combo => {
        const totalStages = combo.reduce((sum, day) => sum + day.stages.length, 0);
        expect(totalStages).toBe(ALTA_VIA_STAGES.length);
      });
    });

    it('should start from Lago di Braies in all combinations', () => {
      const combinations = generateAllCombinations(7);
      
      combinations.forEach(combo => {
        const firstDay = combo[0];
        expect(firstDay.from).toBe('Lago di Braies');
      });
    });

    it('should end at Belluno in all combinations', () => {
      const combinations = generateAllCombinations(7);
      
      combinations.forEach(combo => {
        const lastDay = combo[combo.length - 1];
        expect(lastDay.to).toBe('La Pissa (Belluno)');
      });
    });

    it('should have consecutive stages in each day', () => {
      const combinations = generateAllCombinations(6);
      
      combinations.forEach(combo => {
        let previousStageId = 0;
        
        combo.forEach(day => {
          day.stages.forEach(stage => {
            expect(stage.id).toBe(previousStageId + 1);
            previousStageId = stage.id;
          });
        });
      });
    });

    it('should calculate correct total distance for each day', () => {
      const combinations = generateAllCombinations(5);
      
      combinations.forEach(combo => {
        combo.forEach(day => {
          const calculatedDistance = day.stages.reduce(
            (sum, stage) => sum + stage.distanceKm,
            0
          );
          expect(day.totalDistanceKm).toBe(calculatedDistance);
        });
      });
    });

    it('should calculate correct total ascent for each day', () => {
      const combinations = generateAllCombinations(5);
      
      combinations.forEach(combo => {
        combo.forEach(day => {
          const calculatedAscent = day.stages.reduce(
            (sum, stage) => sum + stage.ascentM,
            0
          );
          expect(day.totalAscentM).toBe(calculatedAscent);
        });
      });
    });

    it('should have unique combinations (no duplicates)', () => {
      const combinations = generateAllCombinations(6);
      
      const comboStrings = combinations.map(combo =>
        combo.map(day => day.stages.map(s => s.id).join(',')).join('|')
      );
      
      const uniqueCombos = new Set(comboStrings);
      expect(uniqueCombos.size).toBe(combinations.length);
    });
  });
});
