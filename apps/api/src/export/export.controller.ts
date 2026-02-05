import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('workouts')
  async exportWorkouts(@Res() res: Response) {
    const csv = await this.exportService.exportWorkoutsCSV();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="iron-log-workouts.csv"',
    );
    res.send(csv);
  }

  @Get('bodyweight')
  async exportBodyWeight(@Res() res: Response) {
    const csv = await this.exportService.exportBodyWeightCSV();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="iron-log-bodyweight.csv"',
    );
    res.send(csv);
  }
}
