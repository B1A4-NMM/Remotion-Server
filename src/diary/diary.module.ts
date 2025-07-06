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
import { Todo } from '../entities/Todo.entity';
import { DiarytodoModule } from '../diarytodo/diarytodo.module';
import { UploadModule } from '../upload/upload.module';
import { AchievementService } from '../achievement-cluster/achievement.service';
import { AchievementModule } from '../achievement-cluster/achievement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diary, DiaryTodo, Member, Todo]),
    AnalysisModule,
    MemberModule,
    ActivityModule,
    TargetModule,
    EmotionModule,
    EmotionModule,
    TodoModule,
    DiarytodoModule,
    UploadModule,
    AchievementModule
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}
