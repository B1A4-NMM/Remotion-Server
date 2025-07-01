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
        @InjectRepository(Todo) private readonly TodoRepository : Repository<Todo>,


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

    /* 
    2. 분석된 DiaryTodo -> 실제 Todo로 확정할 때
    분석 결과 중 하나 선택하여 복사 저장
    */

    async createTodoFromDiary(diaryTodoId : number){
        const diaryTodo =await this.diaryTodoRepository.findOne({
            where: { id:diaryTodoId },
            relations: ['user'], 
        });

        if(!diaryTodo){
            throw new NotFoundException('해당 분석 Todo를 찾을 수 없습니다.');
        }
        const newTodo = this.TodoRepository.create({
            content : diaryTodo.content,
            owner : diaryTodo.member,
            isCompleted : false,

        });

        return await this.TodoRepository.save(newTodo);
    }

}