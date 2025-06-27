import { Module } from '@nestjs/common';
import { VectorService } from './vector.service';
import { VectorController } from './vector.controller';
import { EmbeddingService } from './embedding.service';
import { QdrantService } from './qdrant.service';

@Module({
  controllers: [VectorController],
  providers: [VectorService, EmbeddingService, QdrantService],
})
export class VectorModule {}
