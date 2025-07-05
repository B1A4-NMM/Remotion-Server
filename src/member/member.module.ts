import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../entities/Member.entity';
import { MemberSummary } from '../entities/member-summary.entity';
import { MemberSummaryService } from './member-summary.service';
import { EmotionSummaryScore } from '../entities/emotion-summary-score.entity';

@Module({
  imports: [
    Neo4jModule,
    TypeOrmModule.forFeature([Member, MemberSummary, EmotionSummaryScore])
  ],
  controllers: [MemberController],
  providers: [MemberService, MemberSummaryService],
  exports: [MemberService, MemberSummaryService]
})
export class MemberModule {}
