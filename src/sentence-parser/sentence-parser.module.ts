import { Module } from '@nestjs/common';
import { SentenceParserService } from './sentence-parser.service';
import { SentenceParserController } from './sentence-parser.controller';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [VectorModule],
  controllers: [SentenceParserController],
  providers: [SentenceParserService],
  exports: [SentenceParserService]
})
export class SentenceParserModule {}
