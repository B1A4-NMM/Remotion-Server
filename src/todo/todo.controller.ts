import { Body, Controller, Injectable, Post, UseGuards } from '@nestjs/common';
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
@ApiTags ('할일 목록')
export class TodoController {
    constructor(private readonly todoService : TodoService ){}

    @Post()
    @ApiOperation({ summary : " User Todo 추가 요청 시 DB 저장 "})
    @ApiResponse({
        status: 201 ,
        description : "Todo 저장 완료 ! ",
        type : CreateTodoDto,
    })
    @ApiResponse({ status: 400, description : 'Bad request'})
    @ApiBody({

    })
    @UseGuards(AuthGuard('jwt'))
    //jwt 사용해서 사용자 식별 
    async create(@Body() body: CreateTodoDto, @CurrentUser() user) {
    console.log("controller on")
    try {
      const response = await this.todoService.createTodos(user.id, body);
      return { response };
    } catch (error) {
      throw new Error(`Detail analysis failed: ${error.message}`);
    }
  }



}