import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  findAll(@Query('muscle') muscle?: string) {
    return this.exercisesService.findAll(muscle);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.exercisesService.getHistory(id);
  }

  @Get(':id/pr')
  getPR(@Param('id') id: string) {
    return this.exercisesService.getPR(id);
  }

  @Get(':id/1rm')
  get1RM(@Param('id') id: string) {
    return this.exercisesService.get1RM(id);
  }

  @Post()
  create(@Body() body: { name: string; muscleGroup: string; category: string }) {
    return this.exercisesService.create(body);
  }
}
