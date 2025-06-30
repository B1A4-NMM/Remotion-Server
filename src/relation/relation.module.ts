import { Module } from '@nestjs/common';
import { RelationController } from './relation.controller';
import { TargetModule } from '../target/target.module';
import { RelationService } from './relation.service';
import { EmotionModule } from '../emotion/emotion.module';

@Module({
  imports: [TargetModule, EmotionModule],
  controllers: [RelationController],
  providers: [RelationService],
  exports: []
})
export class RelationModule {}
