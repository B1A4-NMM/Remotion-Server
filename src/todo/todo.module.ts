import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { MemberModule } from '../member/member.module';
import { Todo } from 'src/entities/Todo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Todo]) , MemberModule ],
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService],


})
export class TodoModule {}

