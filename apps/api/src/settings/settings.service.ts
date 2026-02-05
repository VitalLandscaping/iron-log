import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private async getDefaultUserId(): Promise<string> {
    const user = await this.prisma.user.findFirst();
    if (!user) throw new NotFoundException('No user found');
    return user.id;
  }

  async get() {
    const userId = await this.getDefaultUserId();

    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return {
      defaultRestTimerSec: settings.defaultRestTimerSec,
      keepScreenAwake: settings.keepScreenAwake,
      rpeTrackingEnabled: settings.rpeTrackingEnabled,
      availablePlates: JSON.parse(settings.availablePlates),
      barWeight: settings.barWeight,
    };
  }

  async update(data: {
    defaultRestTimerSec?: number;
    keepScreenAwake?: boolean;
    rpeTrackingEnabled?: boolean;
    availablePlates?: number[];
    barWeight?: number;
  }) {
    const userId = await this.getDefaultUserId();

    const updateData: any = {};
    if (data.defaultRestTimerSec !== undefined) {
      updateData.defaultRestTimerSec = data.defaultRestTimerSec;
    }
    if (data.keepScreenAwake !== undefined) {
      updateData.keepScreenAwake = data.keepScreenAwake;
    }
    if (data.rpeTrackingEnabled !== undefined) {
      updateData.rpeTrackingEnabled = data.rpeTrackingEnabled;
    }
    if (data.availablePlates !== undefined) {
      updateData.availablePlates = JSON.stringify(data.availablePlates);
    }
    if (data.barWeight !== undefined) {
      updateData.barWeight = data.barWeight;
    }

    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData },
    });

    return {
      defaultRestTimerSec: settings.defaultRestTimerSec,
      keepScreenAwake: settings.keepScreenAwake,
      rpeTrackingEnabled: settings.rpeTrackingEnabled,
      availablePlates: JSON.parse(settings.availablePlates),
      barWeight: settings.barWeight,
    };
  }
}
