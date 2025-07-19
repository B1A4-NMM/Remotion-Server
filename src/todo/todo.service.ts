import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { TodoCalendarByMonthRes } from './dto/todo-calendar-by-month.dto';
import { Cron } from '@nestjs/schedule';
import { Member } from '../entities/Member.entity';
import { NotificationService } from '../notification/notification.service';
import { TODO_MESSAGE } from '../constants/noti-message.constants';
import { NotificationType } from '../enums/notification-type.enum';
import * as process from 'node:process';
import { ConfigService } from '@nestjs/config';

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
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * todocalendar 날짜 변경
   * @param memberId
   * @param todoId
   * @param date
   */
  async changeTodoCalendarDate(
    memberId: string,
    todoId: number,
    date: LocalDate,
  ) {
    const todoCalendar = await this.todoCalendarRepository.findOne({
      where: {
        member: { id: memberId },
        id: todoId,
      },
    });

    if (!todoCalendar) throw new NotFoundException('TodoCalendar not found');

    todoCalendar.date = date;
    await this.todoCalendarRepository.save(todoCalendar);
    return {
      id: todoCalendar.id,
      content: todoCalendar.content,
      changeDate: todoCalendar.date,
    };
  }

  /**
   * 특정 월의 Todo-Calendar 현황을 날짜별로 그룹화하여 조회합니다.
   * @param memberId - 회원 ID
   * @param year - 조회할 연도
   * @param month - 조회할 월
   * @returns - 날짜별 Todo 현황 DTO 배열
   */
  async getTodoCalendarByMonth(
    memberId: string,
    year: number,
    month: number,
  ): Promise<TodoCalendarByMonthRes[]> {
    // 1. 해당 월의 시작일과 종료일 계산
    const startDate = LocalDate.of(year, month, 1);
    const endDate = startDate.plusMonths(1).minusDays(1);

    // 2. DB에서 해당 기간의 TodoCalendar 항목들을 조회
    const todoCalendars = await this.todoCalendarRepository.find({
      where: {
        member: { id: memberId },
        date: Between(startDate, endDate),
      },
      order: {
        date: 'ASC',
      },
    });

    // 3. 날짜(date)를 기준으로 그룹화
    const groupedByDate = todoCalendars.reduce(
      (acc, todo) => {
        const dateKey = todo.date.toString(); // LocalDate 객체를 문자열 키로 사용
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(todo);
        return acc;
      },
      {} as Record<string, TodoCalendar[]>,
    );

    // 4. 그룹화된 데이터를 DTO로 변환
    const result = Object.entries(groupedByDate).map(([dateStr, todos]) => {
      const date = LocalDate.parse(dateStr);
      const todoTotalCount = todos.length;
      const completedCount = todos.filter((todo) => todo.isCompleted).length;
      const isAllCompleted = todoTotalCount === completedCount;

      return new TodoCalendarByMonthRes(
        date,
        todoTotalCount,
        completedCount,
        isAllCompleted,
      );
    });

    return result;
  }

  /**
   * 특정 기간 동안의 TodoCalendar 항목들을 조회합니다.
   * @param memberId - 회원 ID
   * @param startDate - 조회 시작일
   * @param endDate - 조회 종료일
   * @returns - TodoCalendar 항목 DTO 배열
   */
  async getTodoCalendar(
    memberId: string,
    date: LocalDate,
  ): Promise<TodoCalendarResDto[]> {
    const todoCalendars = await this.todoCalendarRepository.find({
      where: {
        member: { id: memberId },
        date: date,
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
    const todo = await this.todoCalendarRepository.findOne({
      where: { id },
      relations: ['member'],
    });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    if (todo.member.id !== memberId) {
      throw new UnauthorizedException('Not authorized');
    }
    todo.isCompleted = !todo.isCompleted;
    let todoCalendar = await this.todoCalendarRepository.save(todo);
    return { id: todoCalendar.id, isCompleted: todoCalendar.isCompleted };
  }

  /**
   * TodoCalendar 항목을 삭제합니다.
   * @param id - TodoCalendar 항목 ID
   * @param memberId - 회원 ID
   */
  async deleteTodoCalendar(id: number, memberId: string) {
    const todo = await this.todoCalendarRepository.findOne({
      where: { id },
      relations: ['member'],
    });
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
    todo.createdAt = LocalDate.now();
    todo.repeatEndDate = dto.repeatEndDate
      ? LocalDate.parse(dto.repeatEndDate)
      : null;
    todo.isCompleted = false;
    todo.isRepeat = dto.isRepeat ? dto.isRepeat : false;
    todo.repeatRule = dto.repeatRule ? dto.repeatRule : null;
    todo.updatedAt = LocalDate.now();
    todo.date = dto.date ? LocalDate.parse(dto.date) : null;

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
  async getAllTodos(memberId: string) {
    const todos = await this.todoRepository.find({
      where: { owner: { id: memberId } },
      order: { createdAt: 'DESC' },
    });

    return todos.map((t) => new TodoRes(t));
  }

  async createCalendarTodo(dto: CreateCalendarTodoDto, memberId: string) {
    const member = await this.memberService.findOne(memberId);
    const entity = new TodoCalendar();
    entity.content = dto.content;
    entity.date = dto.date;
    entity.member = member;

    let todoCalendar = await this.todoCalendarRepository.save(entity);
    return {
      id: todoCalendar.id,
      content: todoCalendar.content,
      date: todoCalendar.date,
    };
  }

  /**
   * 매일 9시에 완료하지 못한 TODO가 있다면 알림을 전달합니다
   */
  @Cron('0 21 * * *')
  async checkTodoMessage() {
    const env = this.configService.get<string>('ENVIRONMENT')!;
    // if (env === 'develop' || env === 'production'){
    const today = LocalDate.now();
    const todos = await this.todoCalendarRepository.find({
      where: {
        date: today,
        isCompleted: false,
      },
      relations: ['member'],
    });

    const memberMap = new Map<string, Member>();
    for (const todo of todos) {
      memberMap.set(todo.member.id, todo.member);
    }
    const members = Array.from(memberMap.values());

    members.forEach((m) => {
      this.notificationService.createTodoNotification(m.id, today);
    });
  }

  /**
   * todocalendar의 content를 수정합니다
   * @param memberId
   * @param todoId
   * @param content
   */
  async changeTodoCalendarContent(
    memberId: string,
    todoId: number,
    content: string,
  ) {
    const result = await this.todoCalendarRepository.findOne({
      where: {
        member: { id: memberId },
        id: todoId,
      },
    });

    if (!result) throw new NotFoundException('해당 todo를 찾지 못했습니다')

    result.content = content;
    await this.todoCalendarRepository.save(result);
    return {
      id: result.id,
      content: result.content,
      date: result.date,
    };
  }
}
