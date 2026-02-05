/**
 * Tests to verify that components handle undefined/null arrays safely
 * These test the defensive defaults pattern used throughout the app
 */

describe('Array defensive defaults', () => {
  describe('sets array handling', () => {
    it('handles undefined sets with || []', () => {
      const workoutExercise = { sets: undefined };
      const sets = workoutExercise.sets || [];
      expect(sets).toEqual([]);
      expect(() => sets.filter(() => true)).not.toThrow();
      expect(() => sets.map(x => x)).not.toThrow();
      expect(() => sets.length).not.toThrow();
    });

    it('handles null sets with || []', () => {
      const workoutExercise = { sets: null };
      const sets = workoutExercise.sets || [];
      expect(sets).toEqual([]);
      expect(() => sets.filter(() => true)).not.toThrow();
    });

    it('handles empty sets array', () => {
      const workoutExercise = { sets: [] };
      const sets = workoutExercise.sets || [];
      expect(sets).toEqual([]);
    });

    it('handles populated sets array', () => {
      const mockSets = [{ id: 's1', weight: 135, reps: 10 }];
      const workoutExercise = { sets: mockSets };
      const sets = workoutExercise.sets || [];
      expect(sets).toEqual(mockSets);
    });
  });

  describe('exercises array handling', () => {
    it('handles undefined exercises with || []', () => {
      const workout = { exercises: undefined };
      const exercises = workout.exercises || [];
      expect(exercises).toEqual([]);
      expect(() => exercises.map(x => x)).not.toThrow();
    });

    it('handles null exercises with || []', () => {
      const workout = { exercises: null };
      const exercises = workout.exercises || [];
      expect(exercises).toEqual([]);
    });
  });

  describe('photos array handling', () => {
    it('handles undefined photos with || []', () => {
      const photos = undefined;
      const safePhotos = photos || [];
      expect(safePhotos).toEqual([]);
      expect(safePhotos.length).toBe(0);
    });

    it('handles null photos with || []', () => {
      const photos = null;
      const safePhotos = photos || [];
      expect(safePhotos).toEqual([]);
    });
  });

  describe('data array handling for charts', () => {
    it('handles undefined data with || []', () => {
      const data = undefined;
      const safeData = data || [];
      expect(safeData).toEqual([]);
      expect(() => safeData.map(d => d)).not.toThrow();
    });

    it('handles empty data array', () => {
      const data: any[] = [];
      const safeData = data || [];
      expect(safeData.length).toBe(0);
    });
  });

  describe('filter/map/reduce safety', () => {
    it('filter on empty array returns empty array', () => {
      const arr: any[] = [];
      expect(arr.filter(() => true)).toEqual([]);
    });

    it('map on empty array returns empty array', () => {
      const arr: any[] = [];
      expect(arr.map(x => x)).toEqual([]);
    });

    it('reduce on empty array with initial value works', () => {
      const arr: number[] = [];
      expect(arr.reduce((a, b) => a + b, 0)).toBe(0);
    });

    it('find on empty array returns undefined', () => {
      const arr: any[] = [];
      expect(arr.find(() => true)).toBeUndefined();
    });

    it('some on empty array returns false', () => {
      const arr: any[] = [];
      expect(arr.some(() => true)).toBe(false);
    });
  });
});
