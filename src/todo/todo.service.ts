import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from '../member/member.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo } from 'src/entities/Todo.entity';






@Injectable()
export class TodoService {

    constructor(
        private readonly memberService : MemberService,
        @InjectRepository(Todo) private readonly TodoRepository : Repository<Todo>,
    ){}
    
    //한 번에 여러 개의 할 일을 생성 후 DB 삽입 
    async createTodos(memberId:string ,dto : CreateTodoDto){

        const member = await this.memberService.findOne(memberId)

        const todoEntities = dto.todo.map(content => {

            // db에 새로운 엔티티 생성해서 넣어주기
            const todo =new Todo(); 
            todo.owner = member;
            todo.content = content;
            todo.isCompleted =false;
            
            return todo;
        });
        
        return await this.TodoRepository.save(todoEntities);

    }

}