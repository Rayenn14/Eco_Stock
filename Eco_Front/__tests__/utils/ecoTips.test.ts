import { getRandomEcoTip, ECO_TIPS } from '../../src/utils/ecoTips';

describe('Utils: ecoTips', () => {
  describe('ECO_TIPS array', () => {
    it('should contain at least 10 tips', () => {
      expect(ECO_TIPS.length).toBeGreaterThanOrEqual(10);
    });

    it('should contain only non-empty strings', () => {
      ECO_TIPS.forEach((tip: string) => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });

    it('should not contain duplicate tips', () => {
      const uniqueTips = new Set(ECO_TIPS);
      expect(uniqueTips.size).toBe(ECO_TIPS.length);
    });

    it('should have meaningful content (> 20 characters)', () => {
      ECO_TIPS.forEach((tip: string) => {
        expect(tip.length).toBeGreaterThan(20);
      });
    });

    it('should end with proper punctuation', () => {
      ECO_TIPS.forEach((tip: string) => {
        const lastChar = tip[tip.length - 1];
        expect(['.', '!', '?']).toContain(lastChar);
      });
    });
  });

  describe('getRandomEcoTip()', () => {
    it('should return a tip from ECO_TIPS array', () => {
      const tip = getRandomEcoTip();
      expect(ECO_TIPS).toContain(tip);
    });

    it('should return a non-empty string', () => {
      const tip = getRandomEcoTip();
      expect(typeof tip).toBe('string');
      expect(tip.length).toBeGreaterThan(0);
    });

    it('should return different tips on multiple calls (randomness)', () => {
      const tips = new Set<string>();

      // Appeler 50 fois pour avoir une bonne chance d'avoir différents tips
      for (let i = 0; i < 50; i++) {
        tips.add(getRandomEcoTip());
      }

      // On devrait avoir au moins 5 tips différents sur 50 appels
      expect(tips.size).toBeGreaterThanOrEqual(5);
    });

    it('should always return valid tips even when called many times', () => {
      for (let i = 0; i < 100; i++) {
        const tip = getRandomEcoTip();
        expect(ECO_TIPS).toContain(tip);
      }
    });
  });
});
