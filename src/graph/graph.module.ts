import { Module } from '@nestjs/common';
import { GraphDiaryService } from './diray/graph.diary.service';
import { Neo4jService } from './diray/neo4j.service';

@Module({
  imports: [],
  controllers: [],
  providers: [GraphDiaryService, Neo4jService],
})
export class GraphModule {}