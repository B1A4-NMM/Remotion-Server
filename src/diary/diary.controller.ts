import { Body, Controller, Injectable, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DiaryAnalysisDto } from '../graph/diray/dto/diary-analysis.dto';
import { DiaryService } from './diary.service';

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
  async create(@Body('content') content: string) {
    try {
      const response = await this.diaryService.createDiary(content);
      return { response };
    } catch (error) {
      throw new Error(`Detail analysis failed: ${error.message}`);
    }
  }
}