import { Module } from '@nestjs/common';
import { TargetService } from './target.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Target } from '../entities/Target.entity';
import { MemberModule } from '../member/member.module';
import { DiaryTarget } from '../entities/diary-target.entity';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { EmotionModule } from '../emotion/emotion.module';
import { ActivityTarget } from '../entities/ActivityTarget.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Target, DiaryTarget, ActivityTarget]), MemberModule, EmotionModule],
  providers: [TargetService],
  exports: [TargetService],
  controllers: []
})
export class TargetModule {}
