import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { AnalysisModule } from '../analysis/analysis.module';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [AnalysisModule, MemberModule],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}