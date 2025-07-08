import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmotionService } from './emotion.service';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Diary } from '../entities/Diary.entity';
import { DiaryEmotion } from '../entities/diary-emotion.entity';
import { ActivityModule } from '../activity/activity.module';
import { Activity } from '../entities/Activity.entity';
import { EmotionController } from './emotion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmotionTarget, DiaryEmotion,Diary, Activity]), ActivityModule],
  providers: [EmotionService],
  exports: [EmotionService],
  controllers: [EmotionController]
})
export class EmotionModule {}
