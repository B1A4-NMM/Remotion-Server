import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { AnalysisModule } from '../analysis/analysis.module';
import { MemberModule } from '../member/member.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from '../entities/Diary.entity';
import { EmotionModule } from '../emotion/emotion.module';
import { UploadModule } from '../upload/upload.module';
import { MemberSummaryService } from '../member/member-summary.service';
import { MemberSummary } from '../entities/member-summary.entity';
import { SentenceParserModule } from '../sentence-parser/sentence-parser.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diary, MemberSummary]),
    AnalysisModule,
    MemberModule,
    EmotionModule,
    UploadModule,
    SentenceParserModule,
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports:[DiaryService],
})
export class DiaryModule {}
