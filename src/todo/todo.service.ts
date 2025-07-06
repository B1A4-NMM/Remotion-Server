//새로운 Todo를 생성하는 로직
//실제로 Todo 테이블을 다루는 주체

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from '../member/member.service';
import { EmotionService } from '../emotion/emotion.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo } from '../entities/Todo.entity';
import { DiaryTodo } from '../entities/diary-todo.entity';
import { UpdateTodoDto } from './dto/update-todo.dto';






@Injectable()
export class TodoService {

    private readonly logger = new Logger(TodoService.name);

    constructor(
        private readonly memberService : MemberService,
        private readonly emotionService : EmotionService,

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

        this.logger.log("Todo 생성 요청 시작")
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

        
        const saved=await this.todoRepository.save(todo);
        this.logger.log(`Todo 저장 완료:${JSON.stringify(saved)}`);
        return saved;

    }
    

    // date나 repeat 업데이트 할 때 
    async updateTodo(id: string, dto: UpdateTodoDto, memberId : string){
        const todo = await this.todoRepository.findOne({
            where: {
                id,
                owner: { id : memberId },
            },
            relations: ['owner'],
        });

        if(!todo){
            throw new NotFoundException('해당 Todo를 찾을 수 없습니다.');
        }

        if(dto.date !== undefined ){
            todo.date =dto.date; // 그냥 string으로 할당 ? 
        }

        if(dto.isRepeat !== undefined){
            todo.isRepeat =dto.isRepeat;
        }

        await this.todoRepository.save(todo);
        
        return { message: '수정 완료', todo };
    }

    async deleteTodo(id: string, memberId : string ){
        const todo = await this.todoRepository.findOne({
            where: {
                id,
                owner: { id : memberId }, // 사용자 권한 check
            },
            relations: ['owner'],
        });

        if(!todo){
            throw new NotFoundException('해당 Todo를 찾을 수 없습니다.');
        }

        await this.todoRepository.remove(todo);
        
    }

    // [채민.캘린더 부분 구현시 작성함-1]

    async getTodoAndEmotions(memberId : string, from:string, to: string ) {
        
        //데이터 추출할 날짜
        const fromDate = new Date(from);
        const toDate = new Date(to);


        //감정 데이터 , Todo 리스트 동시에 작업 시작(병렬 처리)
        const [emotionData,todos] =await Promise.all([
            this.emotionService.getAllEmotionsGroupedByDateRange(memberId,from,to),
            this.todoRepository.find({
                where:{ owner: { id: memberId }},
                order: { createdAt : 'DESC'},
            }),
        ]);

        return {
            emotions: emotionData,
            todos,
        }
    }
}