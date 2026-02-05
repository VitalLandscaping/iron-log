import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';

interface TemplateExerciseInput {
  exerciseId: string;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
  supersetTag?: string;
}

interface CreateTemplateInput {
  name: string;
  exercises: TemplateExerciseInput[];
}

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  create(@Body() body: CreateTemplateInput) {
    return this.templatesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: CreateTemplateInput) {
    return this.templatesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
