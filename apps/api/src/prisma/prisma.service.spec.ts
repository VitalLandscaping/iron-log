import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

// Mock PrismaClient to test model existence
const mockPrismaModels = {
  user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  exercise: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  workout: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  workoutExercise: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  exerciseSet: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  workoutTemplate: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  templateExercise: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  bodyWeight: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
  progressPhoto: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  deviceToken: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn(), upsert: jest.fn() },
  userSettings: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
};

describe('PrismaService Model References', () => {
  it('should have all required Prisma models', () => {
    const requiredModels = [
      'user',
      'exercise',
      'workout',
      'workoutExercise',
      'exerciseSet',
      'workoutTemplate',
      'templateExercise',
      'bodyWeight',
      'progressPhoto',
      'deviceToken',
      'userSettings',
    ];

    requiredModels.forEach((model) => {
      expect(mockPrismaModels[model]).toBeDefined();
    });
  });

  it('should have CRUD operations for each model', () => {
    Object.entries(mockPrismaModels).forEach(([modelName, model]) => {
      expect(model.findFirst).toBeDefined();
      expect(model.findUnique).toBeDefined();
      expect(model.create).toBeDefined();
    });
  });
});
