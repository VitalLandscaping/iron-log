import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const HARDCODED_USER_ID = 'cm9qaz1jk0000v88c3xjq8r4z';

function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportWorkoutsCSV(): Promise<string> {
    const workouts = await this.prisma.workout.findMany({
      where: {
        userId: HARDCODED_USER_ID,
        endTime: { not: null },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    const headers = [
      'Date',
      'Exercise',
      'Muscle Group',
      'Set',
      'Set Type',
      'Weight (lbs)',
      'Reps',
      'RPE',
      'Est 1RM',
      'Is PR',
      'Session Duration (min)',
    ];

    const rows: string[][] = [];

    for (const workout of workouts) {
      const durationMin = workout.durationMs
        ? Math.round(workout.durationMs / 60000)
        : '';

      for (const workoutExercise of workout.exercises) {
        for (const set of workoutExercise.sets) {
          const e1rm = calculateE1RM(set.weight, set.reps);
          rows.push([
            workout.date,
            workoutExercise.exercise.name,
            workoutExercise.exercise.muscleGroup,
            set.setNumber.toString(),
            set.setType,
            set.weight.toString(),
            set.reps.toString(),
            set.rpe?.toString() || '',
            e1rm.toString(),
            set.isPersonalRecord.toString(),
            durationMin.toString(),
          ]);
        }
      }
    }

    return this.toCSV(headers, rows);
  }

  async exportBodyWeightCSV(): Promise<string> {
    const entries = await this.prisma.bodyWeight.findMany({
      where: { userId: HARDCODED_USER_ID },
      orderBy: { date: 'desc' },
    });

    const headers = ['Date', 'Weight (lbs)'];
    const rows = entries.map((entry) => [entry.date, entry.weight.toString()]);

    return this.toCSV(headers, rows);
  }

  private toCSV(headers: string[], rows: string[][]): string {
    const escape = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const headerLine = headers.map(escape).join(',');
    const dataLines = rows.map((row) => row.map(escape).join(','));

    return [headerLine, ...dataLines].join('\n');
  }
}
