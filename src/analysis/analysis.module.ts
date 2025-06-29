import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisDiaryService } from './analysis-diary.service';
import { ClaudeModule } from '../claude/claude.module';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { DiaryController } from './diary.controller';

@Module({
  imports: [ClaudeModule, Neo4jModule],
  controllers: [DiaryController],
  providers: [AnalysisService, AnalysisDiaryService],
  exports: [AnalysisService, AnalysisDiaryService]
})
export class AnalysisModule {}