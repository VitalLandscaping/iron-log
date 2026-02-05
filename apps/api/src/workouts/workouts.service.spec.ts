import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
  },
  workout: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workoutExercise: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  exerciseSet: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workoutTemplate: {
    findUnique: jest.fn(),
  },
};

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
    prisma = module.get(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new workout', async () => {
      const mockUser = { id: 'user-1', name: 'Test' };
      const mockWorkout = {
        id: 'workout-1',
        userId: 'user-1',
        date: '2024-01-01',
        startTime: new Date(),
        exercises: [],
      };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.workout.create.mockResolvedValue(mockWorkout);

      const result = await service.create();

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.workout.create).toHaveBeenCalled();
      expect(result).toEqual(mockWorkout);
    });

    it('should throw NotFoundException when no user exists', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.create()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated workouts', async () => {
      const mockWorkouts = [
        { id: 'w1', _count: { exercises: 2 }, exercises: [] },
        { id: 'w2', _count: { exercises: 3 }, exercises: [] },
      ];

      prisma.workout.findMany.mockResolvedValue(mockWorkouts);

      const result = await service.findAll(1, 20);

      expect(prisma.workout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].exerciseCount).toBe(2);
    });
  });

  describe('findLatest', () => {
    it('should return the latest completed workout', async () => {
      const mockWorkout = {
        id: 'workout-1',
        endTime: new Date(),
        exercises: [],
      };

      prisma.workout.findFirst.mockResolvedValue(mockWorkout);

      const result = await service.findLatest();

      expect(prisma.workout.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { endTime: { not: null } },
        }),
      );
      expect(result).toEqual(mockWorkout);
    });

    it('should return null when no completed workouts exist', async () => {
      prisma.workout.findFirst.mockResolvedValue(null);

      const result = await service.findLatest();

      expect(result).toBeNull();
    });
  });

  describe('finish', () => {
    it('should finish a workout and detect PRs', async () => {
      const mockWorkout = {
        id: 'workout-1',
        startTime: new Date(Date.now() - 3600000),
        exercises: [
          {
            id: 'we-1',
            exerciseId: 'ex-1',
            exercise: { name: 'Bench Press' },
            sets: [
              { id: 's1', weight: 135, reps: 10, setType: 'normal' },
            ],
          },
        ],
      };

      prisma.workout.findUnique.mockResolvedValue(mockWorkout);
      prisma.exerciseSet.findFirst.mockResolvedValue(null);
      prisma.exerciseSet.update.mockResolvedValue({});
      prisma.workout.update.mockResolvedValue({ ...mockWorkout, endTime: new Date() });

      const result = await service.finish('workout-1');

      expect(prisma.workout.findUnique).toHaveBeenCalled();
      expect(prisma.workout.update).toHaveBeenCalled();
      expect(result.workout).toBeDefined();
      expect(result.newPRs).toBeDefined();
    });

    it('should throw NotFoundException for non-existent workout', async () => {
      prisma.workout.findUnique.mockResolvedValue(null);

      await expect(service.finish('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addExercise', () => {
    it('should add an exercise to a workout', async () => {
      prisma.workout.findUnique.mockResolvedValue({ id: 'workout-1' });
      prisma.workoutExercise.create.mockResolvedValue({
        id: 'we-1',
        workoutId: 'workout-1',
        exerciseId: 'ex-1',
        exercise: { name: 'Squat' },
        sets: [],
      });

      const result = await service.addExercise('workout-1', 'ex-1', 0);

      expect(prisma.workoutExercise.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            workoutId: 'workout-1',
            exerciseId: 'ex-1',
            sortOrder: 0,
          },
        }),
      );
      expect(result.id).toBe('we-1');
    });

    it('should throw NotFoundException for non-existent workout', async () => {
      prisma.workout.findUnique.mockResolvedValue(null);

      await expect(service.addExercise('invalid', 'ex-1', 0)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addSet', () => {
    it('should add a set to a workout exercise', async () => {
      prisma.workoutExercise.findFirst.mockResolvedValue({ id: 'we-1' });
      prisma.exerciseSet.create.mockResolvedValue({
        id: 's1',
        setNumber: 1,
        weight: 135,
        reps: 10,
        setType: 'normal',
      });

      const result = await service.addSet('workout-1', 'we-1', {
        setNumber: 1,
        weight: 135,
        reps: 10,
      });

      expect(prisma.exerciseSet.create).toHaveBeenCalled();
      expect(result.weight).toBe(135);
    });
  });

  describe('updateSet', () => {
    it('should update a set', async () => {
      prisma.exerciseSet.findUnique.mockResolvedValue({
        id: 's1',
        workoutExercise: { workoutId: 'workout-1' },
      });
      prisma.exerciseSet.update.mockResolvedValue({
        id: 's1',
        weight: 145,
        reps: 8,
      });

      const result = await service.updateSet('workout-1', 's1', { weight: 145, reps: 8 });

      expect(prisma.exerciseSet.update).toHaveBeenCalled();
      expect(result.weight).toBe(145);
    });

    it('should throw NotFoundException for invalid set', async () => {
      prisma.exerciseSet.findUnique.mockResolvedValue(null);

      await expect(service.updateSet('workout-1', 'invalid', { weight: 100 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSet', () => {
    it('should delete a set', async () => {
      prisma.exerciseSet.findUnique.mockResolvedValue({
        id: 's1',
        workoutExercise: { workoutId: 'workout-1' },
      });
      prisma.exerciseSet.delete.mockResolvedValue({ id: 's1' });

      const result = await service.deleteSet('workout-1', 's1');

      expect(prisma.exerciseSet.delete).toHaveBeenCalled();
      expect(result.deleted).toBe(true);
    });
  });
});
