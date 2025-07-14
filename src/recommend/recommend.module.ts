import { Module } from '@nestjs/common';
import { RecommendController } from './recommend.controller';
import { RecommendService } from './recommend.service';
import { AuthModule } from '../auth/auth.module';
import { EmotionModule } from '../emotion/emotion.module';
import { DiaryModule } from '../diary/diary.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { ClaudeModule } from '../claude/claude.module';
import { ActivityClusterModule } from '../activity-cluster/activity-cluster.module';

@Module({
  imports: [
    AuthModule,
    EmotionModule,
    DiaryModule,
    YoutubeModule,
    ClaudeModule,
    ActivityClusterModule
  ],
  controllers: [RecommendController],
  providers: [RecommendService],
  exports: [RecommendService],
})
export class RecommendModule {}
