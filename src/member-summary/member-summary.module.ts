import { Module } from '@nestjs/common';
import { MemberSummaryService } from './member-summary.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberSummary } from '../entities/member-summary.entity';
import { MemberModule } from '../member/member.module';
import { EmotionSummaryScore } from '../entities/emotion-summary-score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemberSummary, EmotionSummaryScore]), MemberModule],
  providers: [MemberSummaryService],
  exports : [MemberSummaryService]
})
export class MemberSummaryModule {}
