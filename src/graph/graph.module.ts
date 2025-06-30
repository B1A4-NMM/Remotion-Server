import { Module } from '@nestjs/common';
import { DiaryGraphService } from './diray/diary.graph.service';
import { MemberGraphService } from './member/member.graph.service';
import { SubjectGraphService } from './subject/subject.graph.service';
import { ClaudeModule } from '../claude/claude.module';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { Neo4jController } from './neo4j.controller';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [ClaudeModule, Neo4jModule, AnalysisModule],
  controllers: [Neo4jController],
  providers: [
    DiaryGraphService,
    MemberGraphService,
    SubjectGraphService,
  ],
  exports: [
    MemberGraphService,
    DiaryGraphService,
    SubjectGraphService,
  ]
})
export class GraphModule {}