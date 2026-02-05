import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PR_ELIGIBLE_TYPES = ['normal', 'dropset', 'failure'];

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  private async getDefaultUserId(): Promise<string> {
    const user = await this.prisma.user.findFirst();
    if (!user) throw new NotFoundException('No user found');
    return user.id;
  }

  async create() {
    const userId = await this.getDefaultUserId();
    const now = new Date();
    const date = now.toISOString().split('T')[0];

    return this.prisma.workout.create({
      data: {
        userId,
        date,
        startTime: now,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async finish(id: string) {
    const workout = await this.prisma.workout.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
    });

    if (!workout) throw new NotFoundException('Workout not found');

    const endTime = new Date();
    const durationMs = endTime.getTime() - workout.startTime.getTime();

    // PR Detection
    const newPRs: string[] = [];

    for (const workoutExercise of workout.exercises) {
      const eligibleSets = workoutExercise.sets.filter(
        (s) => PR_ELIGIBLE_TYPES.includes(s.setType) && s.weight > 0,
      );

      if (eligibleSets.length === 0) continue;

      // Get historical max for this exercise (excluding current workout)
      const historicalMax = await this.prisma.exerciseSet.findFirst({
        where: {
          workoutExercise: {
            exerciseId: workoutExercise.exerciseId,
            workoutId: { not: id },
          },
          setType: { in: PR_ELIGIBLE_TYPES },
          weight: { gt: 0 },
        },
        orderBy: { weight: 'desc' },
      });

      const maxHistoricalWeight = historicalMax?.weight ?? 0;

      // Find the highest qualifying set in current workout
      const bestSet = eligibleSets.reduce((best, set) =>
        set.weight > best.weight ? set : best,
      );

      if (bestSet.weight > maxHistoricalWeight) {
        // Mark as PR
        await this.prisma.exerciseSet.update({
          where: { id: bestSet.id },
          data: { isPersonalRecord: true },
        });

        newPRs.push(
          `${workoutExercise.exercise.name}: ${bestSet.weight} lbs × ${bestSet.reps} reps`,
        );
      }
    }

    const updatedWorkout = await this.prisma.workout.update({
      where: { id },
      data: {
        endTime,
        durationMs,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return { workout: updatedWorkout, newPRs };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const workouts = await this.prisma.workout.findMany({
      skip,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        _count: {
          select: { exercises: true },
        },
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return workouts.map((w) => ({
      ...w,
      exerciseCount: w._count.exercises,
    }));
  }

  async findLatest() {
    const workout = await this.prisma.workout.findFirst({
      where: { endTime: { not: null } },
      orderBy: { startTime: 'desc' },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return workout;
  }

  async remove(id: string) {
    const workout = await this.prisma.workout.findUnique({ where: { id } });
    if (!workout) throw new NotFoundException('Workout not found');

    await this.prisma.workout.delete({ where: { id } });
    return { deleted: true };
  }

  // Exercise operations
  async addExercise(workoutId: string, exerciseId: string, sortOrder: number) {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
    });
    if (!workout) throw new NotFoundException('Workout not found');

    return this.prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId,
        sortOrder,
      },
      include: {
        exercise: true,
        sets: true,
      },
    });
  }

  async updateExercise(
    workoutId: string,
    exerciseId: string,
    data: { notes?: string; restTimerSec?: number; sortOrder?: number; supersetTag?: string },
  ) {
    const workoutExercise = await this.prisma.workoutExercise.findFirst({
      where: { workoutId, id: exerciseId },
    });
    if (!workoutExercise) throw new NotFoundException('Workout exercise not found');

    return this.prisma.workoutExercise.update({
      where: { id: exerciseId },
      data,
      include: {
        exercise: true,
        sets: { orderBy: { setNumber: 'asc' } },
      },
    });
  }

  async removeExercise(workoutId: string, exerciseId: string) {
    const workoutExercise = await this.prisma.workoutExercise.findFirst({
      where: { workoutId, id: exerciseId },
    });
    if (!workoutExercise) throw new NotFoundException('Workout exercise not found');

    await this.prisma.workoutExercise.delete({ where: { id: exerciseId } });
    return { deleted: true };
  }

  // Set operations
  async addSet(
    workoutId: string,
    workoutExerciseId: string,
    data: { setNumber: number; weight: number; reps: number; setType?: string; rpe?: number },
  ) {
    const workoutExercise = await this.prisma.workoutExercise.findFirst({
      where: { workoutId, id: workoutExerciseId },
    });
    if (!workoutExercise) throw new NotFoundException('Workout exercise not found');

    return this.prisma.exerciseSet.create({
      data: {
        workoutExerciseId,
        setNumber: data.setNumber,
        weight: data.weight,
        reps: data.reps,
        setType: data.setType ?? 'normal',
        rpe: data.rpe,
      },
    });
  }

  async updateSet(
    workoutId: string,
    setId: string,
    data: { weight?: number; reps?: number; setType?: string; rpe?: number },
  ) {
    const set = await this.prisma.exerciseSet.findUnique({
      where: { id: setId },
      include: { workoutExercise: true },
    });
    if (!set || set.workoutExercise.workoutId !== workoutId) {
      throw new NotFoundException('Set not found');
    }

    return this.prisma.exerciseSet.update({
      where: { id: setId },
      data,
    });
  }

  async deleteSet(workoutId: string, setId: string) {
    const set = await this.prisma.exerciseSet.findUnique({
      where: { id: setId },
      include: { workoutExercise: true },
    });
    if (!set || set.workoutExercise.workoutId !== workoutId) {
      throw new NotFoundException('Set not found');
    }

    await this.prisma.exerciseSet.delete({ where: { id: setId } });
    return { deleted: true };
  }

  async createFromTemplate(templateId: string) {
    const userId = await this.getDefaultUserId();

    // Get the template with exercises
    const template = await this.prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!template) throw new NotFoundException('Template not found');

    const now = new Date();
    const date = now.toISOString().split('T')[0];

    // Create the workout
    const workout = await this.prisma.workout.create({
      data: {
        userId,
        date,
        startTime: now,
        templateName: template.name,
      },
    });

    // Create workout exercises with sets
    for (const templateExercise of template.exercises) {
      // Create the workout exercise
      const workoutExercise = await this.prisma.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: templateExercise.exerciseId,
          sortOrder: templateExercise.sortOrder,
        },
      });

      // Look up the last session for this exercise
      const lastSession = await this.prisma.workoutExercise.findFirst({
        where: {
          exerciseId: templateExercise.exerciseId,
          workout: {
            endTime: { not: null },
            id: { not: workout.id },
          },
        },
        include: {
          sets: { orderBy: { setNumber: 'asc' } },
        },
        orderBy: {
          workout: { startTime: 'desc' },
        },
      });

      if (lastSession && lastSession.sets.length > 0) {
        // Copy sets from last session
        for (const set of lastSession.sets) {
          await this.prisma.exerciseSet.create({
            data: {
              workoutExerciseId: workoutExercise.id,
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
              setType: 'normal',
            },
          });
        }
      } else {
        // Create empty sets based on template defaults
        for (let i = 1; i <= templateExercise.defaultSets; i++) {
          await this.prisma.exerciseSet.create({
            data: {
              workoutExerciseId: workoutExercise.id,
              setNumber: i,
              weight: 0,
              reps: templateExercise.defaultReps,
              setType: 'normal',
            },
          });
        }
      }
    }

    // Return the full workout with exercises and sets
    return this.prisma.workout.findUnique({
      where: { id: workout.id },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }
}
