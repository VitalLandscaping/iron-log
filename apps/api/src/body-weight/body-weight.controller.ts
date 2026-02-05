import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { BodyWeightService } from './body-weight.service';

@Controller('bodyweight')
export class BodyWeightController {
  constructor(private readonly bodyWeightService: BodyWeightService) {}

  @Get()
  findAll(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : undefined;
    return this.bodyWeightService.findAll(daysNum);
  }

  @Post()
  logWeight(@Body() body: { weight: number }) {
    return this.bodyWeightService.logWeight(body.weight);
  }
}
