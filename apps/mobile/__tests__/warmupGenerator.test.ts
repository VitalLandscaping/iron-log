import { generateWarmupSets, WarmupSet } from '../services/warmupGenerator';

describe('generateWarmupSets', () => {
  it('returns warmup sets with correct structure', () => {
    const result = generateWarmupSets(225);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(set => {
      expect(set.setType).toBe('warmup');
      expect(typeof set.weight).toBe('number');
      expect(typeof set.reps).toBe('number');
    });
  });

  it('returns single bar warmup when working weight equals bar', () => {
    const result = generateWarmupSets(45);
    expect(result).toHaveLength(1);
    expect(result[0].weight).toBe(45);
    expect(result[0].reps).toBe(10);
  });

  it('returns single bar warmup when working weight is less than bar', () => {
    const result = generateWarmupSets(30);
    expect(result).toHaveLength(1);
    expect(result[0].weight).toBe(45);
  });

  it('generates correct warmups for 225 lbs working weight', () => {
    const result = generateWarmupSets(225);

    // Should have multiple warmup sets
    expect(result.length).toBeGreaterThan(1);

    // First set should be empty bar
    expect(result[0].weight).toBe(45);
    expect(result[0].reps).toBe(10);

    // All weights should be multiples of 5
    result.forEach(set => {
      expect(set.weight % 5).toBe(0);
    });

    // Weights should be ascending
    for (let i = 1; i < result.length; i++) {
      expect(result[i].weight).toBeGreaterThan(result[i - 1].weight);
    }
  });

  it('handles custom bar weight', () => {
    const result = generateWarmupSets(200, 35);
    expect(result[0].weight).toBeGreaterThanOrEqual(35);
  });

  it('avoids duplicate weights', () => {
    const result = generateWarmupSets(100);
    const weights = result.map(s => s.weight);
    const uniqueWeights = [...new Set(weights)];
    expect(weights).toEqual(uniqueWeights);
  });

  it('returns decreasing reps as weight increases', () => {
    const result = generateWarmupSets(300);
    // Generally reps should decrease (10, 8, 5, 3)
    expect(result[0].reps).toBe(10);
    if (result.length > 1) {
      expect(result[result.length - 1].reps).toBeLessThan(result[0].reps);
    }
  });
});
