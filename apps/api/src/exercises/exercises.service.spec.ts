import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  exercise: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  workoutExercise: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  exerciseSet: {
    findFirst: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
};

describe('ExercisesService', () => {
  let service: ExercisesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all exercises', async () => {
      const mockExercises = [
        { id: 'ex-1', name: 'Bench Press', muscleGroup: 'Chest', category: 'Barbell' },
        { id: 'ex-2', name: 'Squat', muscleGroup: 'Legs', category: 'Barbell' },
      ];

      prisma.exercise.findMany.mockResolvedValue(mockExercises);

      const result = await service.findAll();

      expect(prisma.exercise.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no exercises exist', async () => {
      prisma.exercise.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single exercise', async () => {
      const mockExercise = { id: 'ex-1', name: 'Bench Press', muscleGroup: 'Chest' };

      prisma.exercise.findUnique.mockResolvedValue(mockExercise);

      const result = await service.findOne('ex-1');

      expect(prisma.exercise.findUnique).toHaveBeenCalledWith({
        where: { id: 'ex-1' },
      });
      expect(result).toEqual(mockExercise);
    });

    it('should throw NotFoundException for non-existent exercise', async () => {
      prisma.exercise.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow('Exercise not found');
    });
  });
});
