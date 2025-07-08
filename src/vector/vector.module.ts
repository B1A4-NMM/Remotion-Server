import { Module } from '@nestjs/common';
import { VectorService } from './vector.service';
import { VectorController } from './vector.controller';
import { EmbeddingService } from './embedding.service';
import { QdrantService } from './qdrant.service';
import { SimsceEmbedderService } from './simsce-embedder.service';
import { ClustersService } from './clusters.service';

@Module({
  controllers: [VectorController],
  providers: [VectorService, EmbeddingService, QdrantService, SimsceEmbedderService, ClustersService],
  exports: [EmbeddingService, QdrantService, SimsceEmbedderService, ClustersService]
})
export class VectorModule {}
