import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PR_ELIGIBLE_TYPES = ['normal', 'dropset', 'failure'];

function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async findAll(muscle?: string) {
    const where = muscle ? { muscleGroup: muscle } : {};

    return this.prisma.exercise.findMany({
      where,
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async getHistory(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const sessions = await this.prisma.workoutExercise.findMany({
      where: { exerciseId: id },
      include: {
        workout: true,
        sets: { orderBy: { setNumber: 'asc' } },
      },
      orderBy: { workout: { startTime: 'desc' } },
    });

    return {
      exercise,
      sessions: sessions.map((s) => ({
        workoutId: s.workoutId,
        date: s.workout.date,
        startTime: s.workout.startTime,
        sets: s.sets,
      })),
    };
  }

  async getPR(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const prSet = await this.prisma.exerciseSet.findFirst({
      where: {
        workoutExercise: { exerciseId: id },
        setType: { in: PR_ELIGIBLE_TYPES },
        weight: { gt: 0 },
      },
      orderBy: { weight: 'desc' },
      include: {
        workoutExercise: {
          include: { workout: true },
        },
      },
    });

    if (!prSet) return null;

    return {
      weight: prSet.weight,
      reps: prSet.reps,
      date: prSet.workoutExercise.workout.date,
      isPersonalRecord: prSet.isPersonalRecord,
    };
  }

  async get1RM(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const eligibleSets = await this.prisma.exerciseSet.findMany({
      where: {
        workoutExercise: { exerciseId: id },
        setType: { in: PR_ELIGIBLE_TYPES },
        weight: { gt: 0 },
        reps: { gt: 0 },
      },
      include: {
        workoutExercise: {
          include: { workout: true },
        },
      },
    });

    if (eligibleSets.length === 0) return null;

    let bestSet = eligibleSets[0];
    let bestE1RM = calculateE1RM(bestSet.weight, bestSet.reps);

    for (const set of eligibleSets) {
      const e1rm = calculateE1RM(set.weight, set.reps);
      if (e1rm > bestE1RM) {
        bestE1RM = e1rm;
        bestSet = set;
      }
    }

    return {
      estimated1RM: bestE1RM,
      basedOn: {
        weight: bestSet.weight,
        reps: bestSet.reps,
      },
      date: bestSet.workoutExercise.workout.date,
    };
  }

  async create(data: { name: string; muscleGroup: string; category: string }) {
    return this.prisma.exercise.create({
      data: {
        name: data.name,
        muscleGroup: data.muscleGroup,
        category: data.category,
        isCustom: true,
      },
    });
  }

  async getAllPRs() {
    // Get all PR sets grouped by exercise
    const prSets = await this.prisma.exerciseSet.findMany({
      where: {
        isPersonalRecord: true,
      },
      include: {
        workoutExercise: {
          include: {
            exercise: true,
            workout: true,
          },
        },
      },
      orderBy: { weight: 'desc' },
    });

    // Group by exercise and take the best PR for each
    const exercisePRs = new Map<
      string,
      {
        exerciseId: string;
        exerciseName: string;
        muscleGroup: string;
        weight: number;
        reps: number;
        e1rm: number;
        date: string;
      }
    >();

    for (const set of prSets) {
      const exerciseId = set.workoutExercise.exerciseId;
      const e1rm = calculateE1RM(set.weight, set.reps);

      const existing = exercisePRs.get(exerciseId);
      // Take the heaviest weight PR for each exercise
      if (!existing || set.weight > existing.weight) {
        exercisePRs.set(exerciseId, {
          exerciseId,
          exerciseName: set.workoutExercise.exercise.name,
          muscleGroup: set.workoutExercise.exercise.muscleGroup,
          weight: set.weight,
          reps: set.reps,
          e1rm,
          date: set.workoutExercise.workout.date,
        });
      }
    }

    // Convert to array and sort by weight
    return Array.from(exercisePRs.values()).sort((a, b) => b.weight - a.weight);
  }

  async getExercisesWithHistory() {
    // Get exercises that have at least one workout session
    const exercisesWithSessions = await this.prisma.exercise.findMany({
      where: {
        workoutExercises: {
          some: {
            workout: {
              endTime: { not: null },
            },
          },
        },
      },
      include: {
        workoutExercises: {
          where: {
            workout: {
              endTime: { not: null },
            },
          },
          include: {
            sets: {
              where: {
                setType: { in: PR_ELIGIBLE_TYPES },
              },
            },
          },
        },
      },
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
    });

    return exercisesWithSessions.map((exercise) => {
      const sessionCount = exercise.workoutExercises.length;
      let maxWeight = 0;

      for (const session of exercise.workoutExercises) {
        for (const set of session.sets) {
          if (set.weight > maxWeight) {
            maxWeight = set.weight;
          }
        }
      }

      return {
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        sessionCount,
        maxWeight,
      };
    });
  }
}
