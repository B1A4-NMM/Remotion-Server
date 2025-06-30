import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { AnalysisModule } from '../analysis/analysis.module';
import { MemberModule } from '../member/member.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from '../entities/Diary.entity';
import { ActivityModule } from '../activity/activity.module';
import { TargetModule } from '../target/target.module';
import { EmotionModule } from '../emotion/emotion.module';
import { TodoModule } from '../todo/todo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diary]),
    AnalysisModule,
    MemberModule,
    ActivityModule,
    TargetModule,
    EmotionModule,
    TodoModule
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}
