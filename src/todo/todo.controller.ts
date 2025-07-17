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
  ApiProperty, ApiBearerAuth, ApiQuery, ApiParam, ApiExcludeEndpoint,
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

  @ApiExcludeEndpoint()
  @Get('calendar')
  @ApiOperation({ summary: '기간별 Todo-Calendar 조회' })
  @ApiQuery({
    name: 'startDate',
    description: '조회 시작일 (YYYY-MM-DD)',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    description: '조회 종료일 (YYYY-MM-DD)',
    type: String,
  })
  @ApiResponse({ status: 200, description: '성공', type: [TodoCalendarResDto] })
  async getTodoCalendar(
    @CurrentUser() user: any,
    @Query('startDate', ParseLocalDatePipe) startDate: LocalDate,
    @Query('endDate', ParseLocalDatePipe) endDate: LocalDate,
  ) {
    return this.todoService.getTodoCalendar(user.id, startDate, endDate);
  }

  @ApiExcludeEndpoint()
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

  @ApiExcludeEndpoint()
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

  @ApiExcludeEndpoint()
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
