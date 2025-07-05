import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmotionService } from './emotion.service';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Diary } from '../entities/Diary.entity';
import { DiaryEmotion } from '../entities/diary-emotion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmotionTarget, DiaryEmotion,Diary])],
  providers: [EmotionService],
  exports: [EmotionService]
})
export class EmotionModule {}
