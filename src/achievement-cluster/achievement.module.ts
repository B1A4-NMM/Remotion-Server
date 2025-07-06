import { Module } from '@nestjs/common';
import { AchievementClusterService } from './achievement-cluster.service';
import { AchievementClusterController } from './achievement-cluster.controller';
import { SimsceEmbedderService } from './simsce-embedder.service';
import { QdrantService } from '../vector/qdrant.service';
import { VectorModule } from '../vector/vector.module';
import { AchievementService } from './achievement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryAchievement } from '../entities/diary-achievement.entity.';
import { DiaryAchievementCluster } from '../entities/diary-achievement-cluster.entity';
import { MemberModule } from '../member/member.module';
import { AchievementController } from './achievement.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiaryAchievement, DiaryAchievementCluster]),
    VectorModule,
    MemberModule
  ],
  controllers: [AchievementClusterController, AchievementController],
  providers: [
    AchievementClusterService,
    SimsceEmbedderService,
    AchievementService,
  ],
  exports: [AchievementService],
})
export class AchievementModule {}
