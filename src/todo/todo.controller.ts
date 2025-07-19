import {
  Body,
  Controller,
  Injectable,
  Post,
  Patch,
  UseGuards,
  Get,
  Logger,
  Query,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';

import { CreateTodoDto } from './dto/create-todo.dto';
import { TodoService } from './todo.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { TodoAnalysisDto } from '../diary/dto/diary-analysis.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { GetTodosResponseDto } from './dto/get-todos-response.dto';
import { LocalDate } from 'js-joda';
import { ParseLocalDatePipe } from '../pipe/parse-local-date.pipe';
import { TodoRes } from './dto/todo.res';
import { CreateCalendarTodoDto } from './dto/create-calendar-todo.dto';
import { TodoCalendarResDto } from './dto/todo-calendar.dto';
import { TodoCalendarByMonthRes } from './dto/todo-calendar-by-month.dto';

/*
============================================
@Controller 데코레이터가

해당 클래스를 자동으로 라우팅 클래스로 등록

express에서 router.get이나 
app.get으로 한 것과 동일 
============================================
*/

@Controller('todos')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
@ApiTags('할 일 추가')
export class TodoController {
  private readonly logger = new Logger(TodoController.name);

  constructor(private readonly todoService: TodoService) {}

  @Get('calendar')
  @ApiOperation({ summary: '기간별 Todo-Calendar 조회' })
  @ApiQuery({
    name: 'year',
    description: '조회 연도',
    type: String,
  })
  @ApiQuery({
    name: 'month',
    description: '조회 월',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '성공',
    type: [TodoCalendarByMonthRes],
  })
  async getTodoCalendar(
    @CurrentUser() user: any,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.todoService.getTodoCalendarByMonth(user.id, year, month);
  }

  @Post('calendar')
  @ApiOperation({ summary: 'Todo-Calendar 생성' })
  @ApiBody({ type: CreateCalendarTodoDto })
  @ApiResponse({ status: 200, description: '성공' })
  async createCalendarTodo(
    @CurrentUser() user: any,
    @Body() body: CreateCalendarTodoDto,
  ) {
    const memberId = user.id;
    return await this.todoService.createCalendarTodo(body, memberId);
  }

  @Get('calendar/date')
  @ApiOperation({ summary: '특정 날짜의 Todo-Calendar 조회' })
  @ApiQuery({
    name: 'date',
    description: '조회할 날짜 (YYYY-MM-DD)',
    type: String,
  })
  @ApiResponse({ status: 200, description: '성공', type: [TodoCalendarResDto] })
  async getTodoCalendarByDate(
    @CurrentUser() user: any,
    @Query('date', ParseLocalDatePipe) date: LocalDate,
  ) {
    return this.todoService.getTodoCalendar(user.id, date);
  }

  @Patch('calendar/date/:id')
  @ApiOperation({ summary: 'Todo-Calendar 날짜 변경' })
  @ApiParam({
    name: 'id',
    description: '날짜를 변경할 Todo-Calendar의 ID',
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: '변경할 날짜 (YYYY-MM-DD)',
          example: '2024-01-01',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '성공' })
  async moveTodoCalendarDate(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('date', ParseLocalDatePipe) date: LocalDate,
  ) {
    return this.todoService.changeTodoCalendarDate(user.id, id, date);
  }

  @Patch('calendar/content/:id')
  @ApiOperation({ summary: 'Todo-Calendar 날짜 변경' })
  @ApiParam({
    name: 'id',
    description: '날짜를 변경할 Todo-Calendar의 ID',
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '변경할 Todo 내용',
          example: '미팅 준비하기',
        },
      },
    },
  })
  async changeTodoCalendarContent(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('content')
    content: string,
  ) {
    return this.todoService.changeTodoCalendarContent(user.id, id, content);
  }

  @Patch('calendar/:id')
  @ApiOperation({ summary: 'Todo-Calendar 완료/미완료 토글' })
  @ApiParam({
    name: 'id',
    description: '토글할 Todo-Calendar의 ID',
    type: Number,
  })
  @ApiResponse({ status: 200, description: '성공' })
  async toggleTodoComplete(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.todoService.toggleTodoComplete(id, user.id);
  }

  @Delete('calendar/:id')
  @ApiOperation({ summary: 'Todo-Calendar 삭제' })
  @ApiParam({
    name: 'id',
    description: '삭제할 Todo-Calendar의 ID',
    type: Number,
  })
  @ApiResponse({ status: 200, description: '성공' })
  async deleteTodoCalendar(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.todoService.deleteTodoCalendar(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: ' User Todo 요청 시 DB 저장 ' })
  @ApiResponse({
    status: 200,
    description: 'Todo 저장 완료 ! ',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CreateTodoDto })
  async createTodo(@CurrentUser() user, @Body() dto: CreateTodoDto) {
    this.logger.log(`POST  요청 들어옴: ${JSON.stringify(dto)}`);
    const result = this.todoService.createTodos(user.id, dto);

    return result;
  }

  // 이 부분 캘린더 뷰로 수정 todo + 감정들 보내주기
  @Get()
  @ApiOperation({
    summary: '전체 Todo 조회',
    description: 'User식별해서 전체 todo 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '할 일 조회 성공',
    type: [TodoRes],
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getTodos(@CurrentUser() user) {
    return this.todoService.getAllTodos(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '할 일 반복 여부 설정' })
  @ApiResponse({
    status: 200,
    description: 'Todo 업데이트 성공 ',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth('access-token')
  async updateTodo(
    @Param('id') id: number,
    @Body() updateDto: UpdateTodoDto,
    @CurrentUser() user: any,
  ) {
    return this.todoService.updateTodo(id, updateDto, user.id);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Todo 삭제 성공 ',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: '할 일 삭제' })
  @ApiBearerAuth('access-token')
  async deleteTodo(@Param('id') id: number, @CurrentUser() user: any) {
    await this.todoService.deleteTodo(id, user.id);

    return { message: 'Todo 삭제 성공 ' };
  }
}
