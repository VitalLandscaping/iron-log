export interface WarmupSet {
  weight: number;
  reps: number;
  setType: 'warmup';
}

export function generateWarmupSets(workingWeight: number, barWeight: number = 45): WarmupSet[] {
  if (workingWeight <= barWeight) {
    return [{ weight: barWeight, reps: 10, setType: 'warmup' }];
  }

  const warmups: WarmupSet[] = [];
  const percentages = [
    { pct: 0, reps: 10 },    // empty bar
    { pct: 0.4, reps: 8 },   // 40%
    { pct: 0.6, reps: 5 },   // 60%
    { pct: 0.8, reps: 3 },   // 80%
  ];

  for (const { pct, reps } of percentages) {
    const raw = pct === 0 ? barWeight : workingWeight * pct;
    // Round to nearest 5 lbs, but ensure at least bar weight
    const weight = Math.max(barWeight, Math.round(raw / 5) * 5);

    // Only add if weight is higher than previous warmup (avoid duplicates)
    if (warmups.length === 0 || warmups[warmups.length - 1].weight < weight) {
      warmups.push({ weight, reps, setType: 'warmup' });
    }
  }

  return warmups;
}

// Example usage:
// generateWarmupSets(225) → [
//   { weight: 45, reps: 10, setType: 'warmup' },
//   { weight: 90, reps: 8, setType: 'warmup' },
//   { weight: 135, reps: 5, setType: 'warmup' },
//   { weight: 180, reps: 3, setType: 'warmup' }
// ]
