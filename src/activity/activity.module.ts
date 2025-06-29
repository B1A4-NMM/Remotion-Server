import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../entities/Activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [],
  providers: [ActivityService],
  exports: [ActivityService]
})
export class ActivityModule {}
