import { Module } from '@nestjs/common';
import { AchievementClusterService } from './achievement-cluster.service';
import { AchievementClusterController } from './achievement-cluster.controller';
import { SimsceEmbedderService } from './simsce-embedder.service';
import { QdrantService } from '../vector/qdrant.service';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [VectorModule],
  controllers: [AchievementClusterController],
  providers: [AchievementClusterService, SimsceEmbedderService],
})
export class AchievementClusterModule {}
