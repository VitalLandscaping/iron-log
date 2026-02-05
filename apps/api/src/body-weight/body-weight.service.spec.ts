import { Test, TestingModule } from '@nestjs/testing';
import { BodyWeightService } from './body-weight.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
  },
  bodyWeight: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
};

describe('BodyWeightService', () => {
  let service: BodyWeightService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BodyWeightService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BodyWeightService>(BodyWeightService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return body weight entries', async () => {
      const mockWeights = [
        { id: 'bw-1', date: '2024-01-01', weight: 185 },
        { id: 'bw-2', date: '2024-01-02', weight: 184 },
      ];

      prisma.bodyWeight.findMany.mockResolvedValue(mockWeights);

      const result = await service.findAll();

      expect(prisma.bodyWeight.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no entries exist', async () => {
      prisma.bodyWeight.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should filter by days when provided', async () => {
      prisma.bodyWeight.findMany.mockResolvedValue([]);

      await service.findAll(30);

      expect(prisma.bodyWeight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('logWeight', () => {
    it('should upsert a body weight entry', async () => {
      const mockUser = { id: 'user-1' };
      const mockEntry = { id: 'bw-1', date: '2024-01-01', weight: 185 };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.bodyWeight.upsert.mockResolvedValue(mockEntry);

      const result = await service.logWeight(185);

      expect(prisma.bodyWeight.upsert).toHaveBeenCalled();
      expect(result.weight).toBe(185);
    });
  });
});
