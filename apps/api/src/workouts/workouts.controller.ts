import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  create() {
    return this.workoutsService.create();
  }

  @Patch(':id/finish')
  finish(@Param('id') id: string) {
    return this.workoutsService.finish(id);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.workoutsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('latest')
  findLatest() {
    return this.workoutsService.findLatest();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workoutsService.remove(id);
  }

  // Exercise endpoints
  @Post(':id/exercises')
  addExercise(
    @Param('id') workoutId: string,
    @Body() body: { exerciseId: string; sortOrder: number },
  ) {
    return this.workoutsService.addExercise(
      workoutId,
      body.exerciseId,
      body.sortOrder,
    );
  }

  @Patch(':wid/exercises/:eid')
  updateExercise(
    @Param('wid') workoutId: string,
    @Param('eid') exerciseId: string,
    @Body()
    body: {
      notes?: string;
      restTimerSec?: number;
      sortOrder?: number;
      supersetTag?: string;
    },
  ) {
    return this.workoutsService.updateExercise(workoutId, exerciseId, body);
  }

  @Delete(':wid/exercises/:eid')
  removeExercise(
    @Param('wid') workoutId: string,
    @Param('eid') exerciseId: string,
  ) {
    return this.workoutsService.removeExercise(workoutId, exerciseId);
  }

  // Set endpoints
  @Post(':wid/exercises/:eid/sets')
  addSet(
    @Param('wid') workoutId: string,
    @Param('eid') exerciseId: string,
    @Body()
    body: {
      setNumber: number;
      weight: number;
      reps: number;
      setType?: string;
      rpe?: number;
    },
  ) {
    return this.workoutsService.addSet(workoutId, exerciseId, body);
  }

  @Patch(':wid/sets/:sid')
  updateSet(
    @Param('wid') workoutId: string,
    @Param('sid') setId: string,
    @Body()
    body: {
      weight?: number;
      reps?: number;
      setType?: string;
      rpe?: number;
    },
  ) {
    return this.workoutsService.updateSet(workoutId, setId, body);
  }

  @Delete(':wid/sets/:sid')
  deleteSet(@Param('wid') workoutId: string, @Param('sid') setId: string) {
    return this.workoutsService.deleteSet(workoutId, setId);
  }
}
