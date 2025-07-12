import { VectorModule } from '../vector/vector.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityCluster } from '../entities/activity-cluster.entity';
import { ActivityEmotion } from '../entities/activity-emotion.entity';
import { ActivityClusterService } from './activity-cluster.service';
import { Module } from '@nestjs/common';
import { Activity } from '../entities/Activity.entity';
import { ActivityClusterController } from './activity-cluster.controller';

@Module({
  imports: [
    VectorModule,
    TypeOrmModule.forFeature([ActivityCluster, ActivityEmotion, Activity]),
  ],
  controllers: [ActivityClusterController],
  providers: [ActivityClusterService],
  exports: [ActivityClusterService]
})
export class ActivityClusterModule {}