export interface PlateResult {
  platesPerSide: number[];
  totalWeight: number;
  remainder: number;
}

export const PLATE_COLORS: Record<number, string> = {
  45: '#4488ff',   // blue
  35: '#ffcc00',   // yellow
  25: '#00cc66',   // green
  10: '#e8e8f0',   // white
  5: '#ff4444',    // red
  2.5: '#888888',  // gray
};

export function calculatePlates(
  targetWeight: number,
  barWeight: number = 45,
  availablePlates: number[] = [45, 35, 25, 10, 5, 2.5]
): PlateResult {
  // If target is less than or equal to bar weight, no plates needed
  if (targetWeight <= barWeight) {
    return {
      platesPerSide: [],
      totalWeight: barWeight,
      remainder: 0,
    };
  }

  const sortedPlates = [...availablePlates].sort((a, b) => b - a);
  let remaining = (targetWeight - barWeight) / 2; // weight needed per side
  const platesPerSide: number[] = [];

  for (const plate of sortedPlates) {
    while (remaining >= plate) {
      platesPerSide.push(plate);
      remaining -= plate;
    }
  }

  const loadedPerSide = platesPerSide.reduce((a, b) => a + b, 0);
  return {
    platesPerSide,
    totalWeight: barWeight + loadedPerSide * 2,
    remainder: Math.round(remaining * 2 * 10) / 10,
  };
}

export function formatPlatesPerSide(plates: number[]): string {
  if (plates.length === 0) return 'Empty bar';
  return plates.join(' + ');
}
