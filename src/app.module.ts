import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ClaudeModule } from './claude/claude.module';
import { VectorModule } from './vector/vector.module';
import { GraphModule } from './graph/graph.module';
import { CommonUtilModule } from './util/common-util.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import *as typeormconfig from '../typeorm.config';
import { AnalysisModule } from './analysis/analysis.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { MemberModule } from './member/member.module';
import { ActivityService } from './activity/activity.service';
import { ActivityModule } from './activity/activity.module';
import { TargetModule } from './target/target.module';
import { DiaryModule } from './diary/diary.module';
import { EmotionModule } from './emotion/emotion.module';
import { RelationModule } from './relation/relation.module';

import { TodoModule } from './todo/todo.module';
import { DiarytodoModule } from './diarytodo/diarytodo.module';
import { S3Service } from './s3/s3.service';
import { UploadModule } from './upload/upload.module';
import { AchievementModule } from './achievement-cluster/achievement.module';
import { StrengthModule } from './strength/strength.module';
import { ActivityClusterModule } from './activity-cluster/activity-cluster.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeormconfig),
    AuthModule,
    ClaudeModule,
    VectorModule,
    //GraphModule,
    CommonUtilModule,
    AnalysisModule,
    //Neo4jModule,
    MemberModule,
    ActivityModule,
    TargetModule,
    DiaryModule,
    EmotionModule,
    RelationModule,
    TodoModule,
    DiarytodoModule,
    UploadModule,
    StrengthModule,
    AchievementModule,
    ActivityClusterModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
