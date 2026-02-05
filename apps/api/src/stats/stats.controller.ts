import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('streak')
  getStreak() {
    return this.statsService.getStreak();
  }

  @Get('summary')
  getSummary() {
    return this.statsService.getSummary();
  }

  @Get('muscle-activity')
  getMuscleActivity() {
    return this.statsService.getMuscleActivity();
  }
}
