import { Body, Controller, Injectable, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiaryAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { DiaryService } from './diary.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { CreateDiaryDto } from './dto/create-diary.dto';

@Controller('diary')
@ApiTags('일기')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  @ApiOperation({ summary: '일기 생성 후 분석 내용 받기' })
  @ApiResponse({
    status: 201,
    description: 'The diary has been successfully analyzed',
    type: DiaryAnalysisDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    schema: {
      properties: {
        content: {
          type: 'string',
          description: '일기 내용',
          example: '오늘은 라면을 먹었다...',
        },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: CreateDiaryDto, @CurrentUser() user) {
    console.log("controller on")
    try {
      const response = await this.diaryService.createDiary(user.id, body);
      return { response };
    } catch (error) {
      throw new Error(`Detail analysis failed: ${error.message}`);
    }
  }
}