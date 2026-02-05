import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PR_ELIGIBLE_TYPES = ['normal', 'dropset', 'failure'];

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private async getDefaultUserId(): Promise<string> {
    const user = await this.prisma.user.findFirst();
    if (!user) throw new Error('No user found');
    return user.id;
  }

  async getStreak(): Promise<{ currentStreak: number; longestStreak: number }> {
    const userId = await this.getDefaultUserId();

    // Get all completed workouts sorted by date
    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        endTime: { not: null },
      },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    if (workouts.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Get unique workout dates
    const uniqueDates = [...new Set(workouts.map((w) => w.date))];

    // Calculate current streak
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = 0;
    let checkDate = new Date(today);

    // If no workout today, start from yesterday (streak still alive)
    if (!uniqueDates.includes(todayStr)) {
      if (!uniqueDates.includes(yesterdayStr)) {
        currentStreak = 0;
      } else {
        checkDate = new Date(yesterday);
        currentStreak = this.countConsecutiveDays(uniqueDates, checkDate);
      }
    } else {
      currentStreak = this.countConsecutiveDays(uniqueDates, checkDate);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of uniqueDates.sort()) {
      const currentDate = new Date(dateStr);
      if (prevDate) {
        const diffDays = Math.round(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = currentDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  private countConsecutiveDays(dates: string[], startDate: Date): number {
    let count = 0;
    const checkDate = new Date(startDate);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }

  async getSummary(): Promise<{
    totalWorkouts: number;
    totalSets: number;
    totalTimeMs: number;
    prCount: number;
    thisWeekSessions: number;
  }> {
    const userId = await this.getDefaultUserId();

    // Get Monday of current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString().split('T')[0];

    // Total completed workouts
    const totalWorkouts = await this.prisma.workout.count({
      where: {
        userId,
        endTime: { not: null },
      },
    });

    // Total non-warmup sets
    const totalSets = await this.prisma.exerciseSet.count({
      where: {
        workoutExercise: {
          workout: {
            userId,
            endTime: { not: null },
          },
        },
        setType: { in: PR_ELIGIBLE_TYPES },
      },
    });

    // Total time from completed workouts
    const timeResult = await this.prisma.workout.aggregate({
      where: {
        userId,
        endTime: { not: null },
      },
      _sum: { durationMs: true },
    });
    const totalTimeMs = timeResult._sum.durationMs ?? 0;

    // PR count
    const prCount = await this.prisma.exerciseSet.count({
      where: {
        isPersonalRecord: true,
        workoutExercise: {
          workout: { userId },
        },
      },
    });

    // This week sessions
    const thisWeekSessions = await this.prisma.workout.count({
      where: {
        userId,
        endTime: { not: null },
        date: { gte: mondayStr },
      },
    });

    return {
      totalWorkouts,
      totalSets,
      totalTimeMs,
      prCount,
      thisWeekSessions,
    };
  }

  async getMuscleActivity(): Promise<Record<string, number>> {
    const userId = await this.getDefaultUserId();

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Get all non-warmup sets from last 7 days with their exercise's muscle group
    const sets = await this.prisma.exerciseSet.findMany({
      where: {
        setType: { in: PR_ELIGIBLE_TYPES },
        workoutExercise: {
          workout: {
            userId,
            endTime: { not: null },
            date: { gte: sevenDaysAgoStr },
          },
        },
      },
      include: {
        workoutExercise: {
          include: {
            exercise: {
              select: { muscleGroup: true },
            },
          },
        },
      },
    });

    // Count sets per muscle group
    const muscleActivity: Record<string, number> = {};
    for (const set of sets) {
      const muscleGroup = set.workoutExercise.exercise.muscleGroup;
      muscleActivity[muscleGroup] = (muscleActivity[muscleGroup] || 0) + 1;
    }

    return muscleActivity;
  }
}
