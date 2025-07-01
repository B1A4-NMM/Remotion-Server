import { Body, Controller, Injectable, Post, UseGuards, Get } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateTodoDto } from './dto/create-todo.dto';
import { TodoService } from './todo.service'
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';



/*
============================================
@Controller 데코레이터가

해당 클래스를 자동으로 라우팅 클래스로 등록

express에서 router.get이나 
app.get으로 한 것과 동일 
============================================
*/

@Controller('todo')
@UseGuards(AuthGuard('jwt'))
@ApiTags ('할 일 추가')
export class TodoController {
    constructor(private readonly todoService : TodoService ){}

    @Post()
    @ApiOperation({ summary : " User Todo 요청 시 DB 저장 "})
    @ApiResponse({
        status: 200 ,
        description : "Todo 저장 완료 ! ",
        type : CreateTodoDto,
    })
    @ApiResponse({ status: 400, description : 'Bad request'})
    async createTodo(@CurrentUser() user, @Body() dto : CreateTodoDto){
        return this.todoService.createTodos(user.id, dto);
    }

    @Get()
    @ApiOperation({ summary : " User Todo 요청 시 조회해서 전달 "})
    async getTodos(@CurrentUser() user){
        return this.todoService.getTodoByUserId(user.id);
    }



}