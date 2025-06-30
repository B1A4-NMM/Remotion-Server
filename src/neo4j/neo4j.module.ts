import { Module } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';
import { Neo4jController } from '../graph/neo4j.controller';
import { AnalysisModule } from '../analysis/analysis.module';
import { GraphModule } from '../graph/graph.module';

@Module({
  imports: [],
  controllers: [],
  providers: [Neo4jService],
  exports: [Neo4jService]
})
export class Neo4jModule {}
