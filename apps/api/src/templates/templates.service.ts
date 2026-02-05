import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TemplateExerciseInput {
  exerciseId: string;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
  supersetTag?: string;
}

interface CreateTemplateInput {
  name: string;
  exercises: TemplateExerciseInput[];
}

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  private async getDefaultUserId(): Promise<string> {
    const user = await this.prisma.user.findFirst();
    if (!user) throw new NotFoundException('No user found');
    return user.id;
  }

  async findAll() {
    const userId = await this.getDefaultUserId();

    const templates = await this.prisma.workoutTemplate.findMany({
      where: { userId },
      include: {
        _count: {
          select: { exercises: true },
        },
        exercises: {
          include: { exercise: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return templates.map((t) => ({
      ...t,
      exerciseCount: t._count.exercises,
    }));
  }

  async findOne(id: string) {
    const template = await this.prisma.workoutTemplate.findUnique({
      where: { id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(data: CreateTemplateInput) {
    const userId = await this.getDefaultUserId();

    const template = await this.prisma.workoutTemplate.create({
      data: {
        userId,
        name: data.name,
        exercises: {
          create: data.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            sortOrder: e.sortOrder,
            defaultSets: e.defaultSets,
            defaultReps: e.defaultReps,
          })),
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return template;
  }

  async update(id: string, data: CreateTemplateInput) {
    const template = await this.prisma.workoutTemplate.findUnique({
      where: { id },
    });

    if (!template) throw new NotFoundException('Template not found');

    // Delete existing exercises and recreate
    await this.prisma.templateExercise.deleteMany({
      where: { templateId: id },
    });

    const updated = await this.prisma.workoutTemplate.update({
      where: { id },
      data: {
        name: data.name,
        exercises: {
          create: data.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            sortOrder: e.sortOrder,
            defaultSets: e.defaultSets,
            defaultReps: e.defaultReps,
          })),
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const template = await this.prisma.workoutTemplate.findUnique({
      where: { id },
    });

    if (!template) throw new NotFoundException('Template not found');

    await this.prisma.workoutTemplate.delete({ where: { id } });
    return { deleted: true };
  }
}
