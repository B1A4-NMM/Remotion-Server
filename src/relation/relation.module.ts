import { Module } from '@nestjs/common';
import { RelationController } from './relation.controller';
import { TargetModule } from '../target/target.module';
import { RelationService } from './relation.service';

@Module({
  imports: [TargetModule],
  controllers: [RelationController],
  providers: [RelationService],
  exports: []
})
export class RelationModule {}
