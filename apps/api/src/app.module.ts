import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ApiKeyGuard } from './guards/api-key.guard';
import { WorkoutsModule } from './workouts/workouts.module';
import { ExercisesModule } from './exercises/exercises.module';
import { SettingsModule } from './settings/settings.module';
import { TemplatesModule } from './templates/templates.module';
import { StatsModule } from './stats/stats.module';
import { BodyWeightModule } from './body-weight/body-weight.module';
import { PhotosModule } from './photos/photos.module';
import { ExportModule } from './export/export.module';
import { NotificationModule } from './notifications/notification.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    WorkoutsModule,
    ExercisesModule,
    SettingsModule,
    TemplatesModule,
    StatsModule,
    BodyWeightModule,
    PhotosModule,
    ExportModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
