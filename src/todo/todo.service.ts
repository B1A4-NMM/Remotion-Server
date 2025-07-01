//새로운 Todo를 생성하는 로직
//실제로 Todo 테이블을 다루는 주체

import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from '../member/member.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo } from '../entities/Todo.entity';
import { DiaryTodo } from '../entities/diary-todo.entity';






@Injectable()
export class TodoService {

    constructor(
        private readonly memberService : MemberService,
        @InjectRepository(Todo) private readonly todoRepository : Repository<Todo>,


        @InjectRepository(DiaryTodo)
        private readonly diaryTodoRepository : Repository<DiaryTodo>
    ){}
    
    /*
    1. 사용자가 직접 Todo를 입력할 때 
    클라이언트가 todo: string[] 직접 전송
    한 번에 여러 개의 할 일을 생성 후 DB 삽입 
    */
    async createTodos(memberId:string ,dto : CreateTodoDto){

        const member = await this.memberService.findOne(memberId)


        const todo = this.todoRepository.create({
            title: dto.title,
            date: dto.date,
            isRepeat: dto.isRepeat ?? false,
            repeatRule: dto.repeatRule,
            repeatEndDate: dto.repeatEndDate,
            isCompleted: false,
            owner: member,
          });

        
        
        return await this.todoRepository.save(todo);

    }

    async getTodoByUserId(memberId : string ){
        return this.todoRepository.find({
            where: { owner: { id: memberId} },
            order: { createdAt: 'DESC'},
        });
    }
}