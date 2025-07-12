import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../entities/Activity.entity';
import { VectorModule } from '../vector/vector.module';
import { ActivityController } from './activity.controller';
import { ActivityEmotion } from '../entities/activity-emotion.entity';
import { ActivityClusterModule } from '../activity-cluster/activity-cluster.module';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityEmotion]),
    VectorModule,
    ActivityClusterModule
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService]
})
export class ActivityModule {}
