import { Module } from '@nestjs/common';
import { VectorModule } from '../vector/vector.module';
import { ClaudeModule } from '../claude/claude.module';
import { KeywordService } from './keyword.service';

@Module({
  imports: [VectorModule, ClaudeModule],
  controllers: [],
  providers: [KeywordService],
  exports: [KeywordService]
})
export class KeywordModule {}
