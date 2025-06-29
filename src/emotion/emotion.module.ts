import { Module } from '@nestjs/common';
import { EmotionService } from './emotion.service';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([EmotionTarget])],
  providers: [EmotionService],
  exports: [EmotionService]
})
export class EmotionModule {}
