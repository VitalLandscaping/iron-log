import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const HARDCODED_USER_ID = 'cm9qaz1jk0000v88c3xjq8r4z';

@Injectable()
export class BodyWeightService {
  constructor(private prisma: PrismaService) {}

  async findAll(days?: number) {
    const where: any = { userId: HARDCODED_USER_ID };

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      where.date = { gte: startDate.toISOString().split('T')[0] };
    }

    return this.prisma.bodyWeight.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async logWeight(weight: number) {
    const today = new Date().toISOString().split('T')[0];

    return this.prisma.bodyWeight.upsert({
      where: {
        userId_date: {
          userId: HARDCODED_USER_ID,
          date: today,
        },
      },
      update: { weight },
      create: {
        userId: HARDCODED_USER_ID,
        date: today,
        weight,
      },
    });
  }

  async getLatest() {
    return this.prisma.bodyWeight.findFirst({
      where: { userId: HARDCODED_USER_ID },
      orderBy: { date: 'desc' },
    });
  }
}
