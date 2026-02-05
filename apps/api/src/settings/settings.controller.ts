import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get() {
    return this.settingsService.get();
  }

  @Patch()
  update(
    @Body()
    body: {
      defaultRestTimerSec?: number;
      keepScreenAwake?: boolean;
      rpeTrackingEnabled?: boolean;
      availablePlates?: number[];
      barWeight?: number;
    },
  ) {
    return this.settingsService.update(body);
  }
}
