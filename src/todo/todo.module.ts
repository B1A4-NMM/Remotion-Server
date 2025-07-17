import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { MemberModule } from '../member/member.module';

import { Todo } from '../entities/Todo.entity';
import { DiaryTodo } from '../entities/diary-todo.entity'; // ← 이거 추가
import { Member } from '../entities/Member.entity';
import { MemberService } from '../member/member.service';
import { Neo4jModule } from '../neo4j/neo4j.module'; // ✅ 추가
import { EmotionModule } from '../emotion/emotion.module';
import { TodoCalendar } from '../entities/todo-calendar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Todo,DiaryTodo,Member, TodoCalendar]) , MemberModule, Neo4jModule, EmotionModule ],
  controllers: [TodoController],
  providers: [TodoService,MemberService],
  exports : [TodoService],

})
export class TodoModule {}

