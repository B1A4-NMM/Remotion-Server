import { Module } from '@nestjs/common';
import { DiarytodoService } from './diarytodo.service';
import { DiarytodoController } from './diarytodo.controller';
import { DiaryTodo } from '../entities/diary-todo.entity';
import { Diary } from '../entities/Diary.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([DiaryTodo,Diary])],
  controllers: [DiarytodoController],
  providers: [DiarytodoService],
  exports : [DiarytodoService],
})
export class DiarytodoModule {}
