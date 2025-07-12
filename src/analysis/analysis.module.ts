import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisDiaryService } from './analysis-diary.service';
import { ClaudeModule } from '../claude/claude.module';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from '../entities/Diary.entity';
import { DiaryTodo } from '../entities/diary-todo.entity';
import { Member } from '../entities/Member.entity';
import { Todo } from '../entities/Todo.entity';
import { MemberModule } from '../member/member.module';
import { ActivityModule } from '../activity/activity.module';
import { TargetModule } from '../target/target.module';
import { EmotionModule } from '../emotion/emotion.module';
import { TodoModule } from '../todo/todo.module';
import { DiarytodoModule } from '../diarytodo/diarytodo.module';
import { UploadModule } from '../upload/upload.module';
import { AchievementModule } from '../achievement-cluster/achievement.module';
import { SentenceParserModule } from '../sentence-parser/sentence-parser.module';

@Module({
  imports: [
    ClaudeModule,
    Neo4jModule,
    TypeOrmModule.forFeature([Diary, DiaryTodo, Member, Todo]),
    MemberModule,
    ActivityModule,
    TargetModule,
    EmotionModule,
    EmotionModule,
    TodoModule,
    DiarytodoModule,
    UploadModule,
    AchievementModule,
    SentenceParserModule
  ],
  controllers: [],
  providers: [AnalysisService, AnalysisDiaryService],
  exports: [AnalysisService, AnalysisDiaryService],
})
export class AnalysisModule {}
