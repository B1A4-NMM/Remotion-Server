import { VectorModule } from '../vector/vector.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityCluster } from '../entities/activity-cluster.entity';
import { ActivityEmotion } from '../entities/activity-emotion.entity';
import { ActivityClusterService } from './activity-cluster.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    VectorModule,
    TypeOrmModule.forFeature([ActivityCluster, ActivityEmotion]),
  ],
  controllers: [],
  providers: [ActivityClusterService],
  exports: []
})
export class ActivityClusterModule {}