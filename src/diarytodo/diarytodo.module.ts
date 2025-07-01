import { Module } from '@nestjs/common';
import { DiarytodoService } from './diarytodo.service';
import { DiarytodoController } from './diarytodo.controller';

@Module({
  controllers: [DiarytodoController],
  providers: [DiarytodoService],
  exports : [DiarytodoService],
})
export class DiarytodoModule {}
