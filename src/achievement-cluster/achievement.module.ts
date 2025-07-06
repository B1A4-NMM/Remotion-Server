import { Module } from '@nestjs/common';
import { AchievementClusterService } from './achievement-cluster.service';
import { AchievementClusterController } from './achievement-cluster.controller';
import { SimsceEmbedderService } from './simsce-embedder.service';
import { QdrantService } from '../vector/qdrant.service';
import { VectorModule } from '../vector/vector.module';
import { AchievementService } from './achievement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryAchievement } from '../entities/diary-achievement';
import { DiaryAchievementCluster } from '../entities/diary-achievement-cluster.entity';

@Module({
  imports: [VectorModule, TypeOrmModule.forFeature([DiaryAchievement, DiaryAchievementCluster])],
  controllers: [AchievementClusterController],
  providers: [AchievementClusterService, SimsceEmbedderService, AchievementService],
  exports: [AchievementService]
})
export class AchievementModule {}
