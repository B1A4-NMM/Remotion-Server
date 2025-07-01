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
import { DiaryTodo } from '../entities/diary-todo.entity'; // ✅ 추가
import { Member } from '../entities/Member.entity';
import { TodoService } from '../todo/todo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diary,DiaryTodo,Member]),
    AnalysisModule,
    MemberModule,
    ActivityModule,
    TargetModule,
    EmotionModule,
    TodoModule,
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}
