import { Body, Controller, Injectable, Post, Patch ,UseGuards, Get, Logger, Query, Param, Delete } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateTodoDto } from './dto/create-todo.dto';
import { TodoService } from './todo.service'
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { TodoAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';


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
@ApiTags ('할 일 추가')
export class TodoController {


    private readonly logger = new Logger(TodoController.name);
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
        this.logger.log(`POST  요청 들어옴: ${JSON.stringify(dto)}`)
        //console.log('[POST/todo] 요청 body :',dto);

      
        const result =this.todoService.createTodos(user.id, dto);

        //console.log("응답 완료:",result);

        return result;
    }


    // 이 부분 캘린더 뷰로 수정 todo + 감정들 보내주기 
    @Get()
    @ApiOperation({ summary : "전체 Todo 조회",
    description: "User식별해서 전체 todo목록을 조회합니다."
    })
    // @ApiResponse({
    //     status: 200,
    //     description : "Todo 조회 완료"
    // })
    @ApiResponse({ status: 200, description: '할 일 조회 성공' })
    @ApiResponse({ status: 400, description : 'Bad request'})
    async getTodos(@Query('from') from: string,
                   @Query('to') to: string,
                   @CurrentUser() user
                   ){
                    
        //console.log("Todo 조회 성공")
        return this.todoService.getTodoAndEmotions(user.id,from,to);
    }


    @Patch(':id')
    async updateTodo(
        @Param('id') id: string,
        @Body() updateDto : UpdateTodoDto,
        @CurrentUser() user: any,
    ){
        return this.todoService.updateTodo(id, updateDto, user.id);
    }

    @Delete(':id')
    async deleteTodo(@Param('id') id:string,@CurrentUser() user : any){
        await this.todoService.deleteTodo(id, user.id);

        return { message: 'Todo 삭제 성공 '};
    }




}