import { Module } from '@nestjs/common';
import { EmotionService } from './emotion.service';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryEmotion } from '../entities/diary-emotion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmotionTarget, DiaryEmotion])],
  providers: [EmotionService],
  exports: [EmotionService]
})
export class EmotionModule {}
