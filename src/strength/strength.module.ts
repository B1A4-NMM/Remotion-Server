import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrengthService } from './strength.service';
import { StrengthController } from './strength.controller';

import { MemberModule } from '../member/member.module';
import { EmotionModule } from '../emotion/emotion.module';
import { DiaryModule } from '../diary/diary.module';

import { Activity } from '../entities/Activity.entity';
import { Member } from '../entities/Member.entity'; // 필요 시
import { Diary } from '../entities/Diary.entity';


@Module({
  imports: [
    MemberModule,
    EmotionModule,
    DiaryModule,
    TypeOrmModule.forFeature([Activity,Member,Diary]),
  ],
  controllers: [StrengthController],
  providers: [StrengthService],
})
export class StrengthModule {}
