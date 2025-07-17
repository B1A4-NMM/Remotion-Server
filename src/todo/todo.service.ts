import { Injectable, NotFoundException, Logger, UnauthorizedException } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from '../member/member.service';
import { EmotionService } from '../emotion/emotion.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo } from '../entities/Todo.entity';
import { DiaryTodo } from '../entities/diary-todo.entity';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { LocalDate } from 'js-joda';
import { TodoRes } from './dto/todo.res';
import { TodoCalendar } from '../entities/todo-calendar.entity';
import { CreateCalendarTodoDto } from './dto/create-calendar-todo.dto';
import { TodoCalendarResDto } from './dto/todo-calendar.dto';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(
    private readonly memberService: MemberService,
    private readonly emotionService: EmotionService,
    @InjectRepository(Todo) private readonly todoRepository: Repository<Todo>,
    @InjectRepository(DiaryTodo)
    private readonly diaryTodoRepository: Repository<DiaryTodo>,
    @InjectRepository(TodoCalendar)
    private readonly todoCalendarRepository: Repository<TodoCalendar>,
  ) {}

  /**
   * 특정 기간 동안의 TodoCalendar 항목들을 조회합니다.
   * @param memberId - 회원 ID
   * @param startDate - 조회 시작일
   * @param endDate - 조회 종료일
   * @returns - TodoCalendar 항목 DTO 배열
   */
  async getTodoCalendar(
    memberId: string,
    startDate: LocalDate,
    endDate: LocalDate,
  ): Promise<TodoCalendarResDto[]> {
    const todoCalendars = await this.todoCalendarRepository.find({
      where: {
        member: { id: memberId },
        date: Between(startDate, endDate),
      },
    });

    return todoCalendars.map(
      (todo) => new TodoCalendarResDto(todo.id, todo.isCompleted, todo.content),
    );
  }

  /**
   * TodoCalendar 항목의 isCompleted 상태를 토글합니다.
   * @param id - TodoCalendar 항목 ID
   * @param memberId - 회원 ID
   * @returns - 업데이트된 TodoCalendar 항목
   */
  async toggleTodoComplete(id: number, memberId: string) {
    const todo = await this.todoCalendarRepository.findOne({ where: { id }, relations: ['member'] });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    if (todo.member.id !== memberId) {
      throw new UnauthorizedException('Not authorized');
    }
    todo.isCompleted = !todo.isCompleted;
    let todoCalendar = await this.todoCalendarRepository.save(todo);
    return {id:todoCalendar.id, isCompleted: todoCalendar.isCompleted}
  }

  /**
   * TodoCalendar 항목을 삭제합니다.
   * @param id - TodoCalendar 항목 ID
   * @param memberId - 회원 ID
   */
  async deleteTodoCalendar(id: number, memberId: string) {
    const todo = await this.todoCalendarRepository.findOne({ where: { id }, relations: ['member'] });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    if (todo.member.id !== memberId) {
      throw new UnauthorizedException('Not authorized');
    }
    const result = await this.todoCalendarRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Todo not found');
    }
  }

  /*
  1. 사용자가 직접 Todo를 입력할 때 
  클라이언트가 todo: string[] 직접 전송
  한 번에 여러 개의 할 일을 생성 후 DB 삽입 
  */
  async createTodos(memberId: string, dto: CreateTodoDto) {
    this.logger.log('Todo 생성 요청 시작');
    const member = await this.memberService.findOne(memberId);

    const todo = new Todo();
    todo.title = dto.title;
    todo.owner = member;
    todo.createdAt = LocalDate.now()
    todo.repeatEndDate = dto.repeatEndDate ? LocalDate.parse(dto.repeatEndDate) : null
    todo.isCompleted = false;
    todo.isRepeat = dto.isRepeat ? dto.isRepeat : false ;
    todo.repeatRule = dto.repeatRule ? dto.repeatRule : null;
    todo.updatedAt = LocalDate.now()
    todo.date = dto.date ? LocalDate.parse(dto.date) : null


    const saved = await this.todoRepository.save(todo);
    this.logger.log(`Todo 저장 완료:${JSON.stringify(saved)}`);
    return saved;
  }

  // date나 repeat 업데이트 할 때
  async updateTodo(id: number, dto: UpdateTodoDto, memberId: string) {
    const todo = await this.todoRepository.findOne({
      where: {
        id,
        owner: { id: memberId },
      },
      relations: ['owner'],
    });

    if (!todo) {
      throw new NotFoundException('해당 Todo를 찾을 수 없습니다.');
    }

    if (dto.title !== undefined) {
      todo.title = dto.title;
    }

    if (dto.date !== undefined) {
      todo.date = dto.date; // 그냥 string으로 할당 ?
    }

    if (dto.isRepeat !== undefined) {
      todo.isRepeat = dto.isRepeat;
    }

    if (dto.repeatRule !== undefined) {
      todo.repeatRule = dto.repeatRule;
    }

    if (dto.repeatEndDate != undefined) {
      todo.repeatEndDate = dto.repeatEndDate;
    }

    if (dto.isCompleted != undefined) {
      todo.isCompleted = dto.isCompleted;
    }

    await this.todoRepository.save(todo);

    return { message: '수정 완료', todo };
  }

  async deleteTodo(id: number, memberId: string) {
    const todo = await this.todoRepository.findOne({
      where: {
        id,
        owner: { id: memberId }, // 사용자 권한 check
      },
      relations: ['owner'],
    });

    if (!todo) {
      throw new NotFoundException('해당 Todo를 찾을 수 없습니다.');
    }

    await this.todoRepository.remove(todo);
  }

  // [채민.캘린더 부분 구현시 작성함-1]
  async getTodoAndEmotions(memberId: string, from: LocalDate, to: LocalDate) {
    //감정 데이터 , Todo 리스트 동시에 작업 시작(병렬 처리)
    const [emotionData, todos] = await Promise.all([
      this.emotionService.getAllEmotionsGroupedByDateRange(memberId, from, to),
      this.todoRepository.find({
        where: { owner: { id: memberId } },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      emotions: emotionData,
      todos,
    };
  }

  /**
   * 해당 멤버가 가진 모든 TODO 반환
   */
  async getAllTodos(memberId:string){
    const todos = await this.todoRepository.find({
      where: { owner: { id: memberId } },
      order: { createdAt: 'DESC' },
    })

    return todos.map((t) => new TodoRes(t));
  }

  async createCalendarTodo(dto: CreateCalendarTodoDto, memberId:string){
    const member = await this.memberService.findOne(memberId);
    const entity = new TodoCalendar();
    entity.content = dto.content;
    entity.date = dto.date
    entity.member = member

    let todoCalendar = await this.todoCalendarRepository.save(entity);
    return {id : todoCalendar.id, content : todoCalendar.content, date : todoCalendar.date}
  }
}
