import { Module } from '@nestjs/common';
import { BodyWeightController } from './body-weight.controller';
import { BodyWeightService } from './body-weight.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BodyWeightController],
  providers: [BodyWeightService],
  exports: [BodyWeightService],
})
export class BodyWeightModule {}
