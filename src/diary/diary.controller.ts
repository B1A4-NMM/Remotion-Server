import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Injectable,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DiaryAnalysisDto } from './dto/diary-analysis.dto';
import { DiaryService } from './diary.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { DiaryListRes } from './dto/diary-list.res';
import { DiaryHomeRes } from './dto/diary-home.res';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../s3/s3.service';
import { CreateDiaryRes } from './dto/create-diary.res';
import { CommonUtilService } from '../util/common-util.service';
import * as util from 'node:util';
import { ParseLocalDatePipe } from '../pipe/parse-local-date.pipe';
import { LocalDate } from 'js-joda';
import { DiaryAnalysisSchema } from '../constants/swagger-scheme.constant';
import { MemberSummaryRes } from '../member/dto/member-summary.res';

@Controller('diary')
@ApiTags('일기')
export class DiaryController {
  constructor(
    private readonly diaryService: DiaryService,
    private readonly s3Service: S3Service,
    private readonly util: CommonUtilService,
  ) {}

  @Post()
  @ApiOperation({ summary: '일기 생성 후 분석 내용 받기' })
  @ApiResponse({
    status: 201,
    description: '다이어리 생성 완료',
    type: CreateDiaryRes,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    type: CreateDiaryDto,
  })
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() body: CreateDiaryDto,
    @CurrentUser() user,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;
    if (photo) {
      imageUrl = await this.s3Service.uploadFile(photo);
    }
    const memberId = user.id;

    const createId = await this.diaryService.createDiary(
      memberId,
      body,
      imageUrl,
    );
    return new CreateDiaryRes(createId);
  }

  @Get('date/emotion/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '특정 일기 기준으로 기간별 감정 변화 조회' })
  @ApiParam({
    name: 'id',
    description: '기준이 되는 일기의 ID',
    type: 'string',
    required: true,
  })
  @ApiQuery({
    name: 'period',
    description: '조회할 기간(일)',
    type: 'number',
    required: true,
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: '기간별 감정 분석 결과',
    type: MemberSummaryRes,
  })
  async getDiaryByDateAndEmotion(
    @Query('period') period: number,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const memberId = user.id;
    return await this.diaryService.findMemberSummaryByDateAndPeriod(
      memberId,
      +id,
      period,
    );
  }

  @ApiOperation({ summary: '자신이 작성한 모든 일기 받기' })
  @ApiBody({ type: DiaryListRes })
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async allDiaries(@CurrentUser() user) {
    const memberId = user.id;
    return await this.diaryService.getDiaryList(memberId);
  }

  @ApiOperation({ summary: '자신이 특정 날짜에 작성한 일기 받기' })
  @ApiQuery({
    name: 'date',
    required: true,
    type: Date,
    description: '조회할 날짜',
    example: '2021-01-01',
  })
  @ApiResponse({ type: DiaryHomeRes })
  @Get('date')
  @UseGuards(AuthGuard('jwt'))
  async getDiaryByDate(
    @CurrentUser() user: any,
    @Query('date', ParseLocalDatePipe) date: LocalDate,
  ) {
    const memberId = user.id;
    return await this.diaryService.getDiaryInfoByDate(memberId, date);
  }

  @ApiOperation({
    summary: '홈 화면',
    description: '오늘 작성한 일기와 그에 나타난 감정들을 보여줍니다',
  })
  @ApiBody({ type: DiaryHomeRes })
  @Get('/today')
  @UseGuards(AuthGuard('jwt'))
  async getTodayDiary(@CurrentUser() user): Promise<DiaryHomeRes> {
    const memberId = user.id;
    return this.diaryService.getHomeDiaries(memberId);
  }

  @ApiOperation({ summary: '특정 일기 가공 데이터 조회' })
  @ApiResponse({ type: DiaryAnalysisDto })
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getDiary(@CurrentUser() user, @Param('id') id: string) {
    const memberId: string = user.id;
    return await this.diaryService.getDiary(memberId, +id);
  }

  @ApiOperation({ summary: '특정 일기 json 데이터 조회' })
  @ApiResponse({
    status: 200,
    description: '일기 분석 결과',
    schema: DiaryAnalysisSchema,
  })
  @Get('json/:id')
  @UseGuards(AuthGuard('jwt'))
  async getDiaryToJson(@CurrentUser() user, @Param('id') id: string) {
    const memberId: string = user.id;
    return await this.diaryService.getDiaryJson(memberId, +id);
  }

  @ApiOperation({ summary: '일기 삭제' })
  @ApiParam({
    name: 'id',
    description: '삭제할 일기의 ID',
    type: 'string',
    required: true,
  })
  @ApiResponse({ status: 200, description: '일기 삭제 성공' })
  @ApiResponse({ status: 404, description: '해당 일기의 주인이 아닙니다' })
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteDiary(@CurrentUser() user: any, @Param('id') id: string) {
    const memberId: string = user.id;
    return await this.diaryService.deleteDiary(memberId, +id);
  }

  @Delete('all')
  @UseGuards(AuthGuard('jwt'))
  async deleteAll(@CurrentUser() user) {
    const memberId: string = user.id;
    return await this.diaryService.deleteAll(memberId);
  }

  @ApiOperation({
    summary: '일기 전체 조회',
    description: '무한스크롤을 통해 일기를 조회할 수 있습니다',
  })
  @ApiBody({ type: DiaryListRes })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 번에 가져올 일기 개수',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '마지막으로 가져온 일기의 ID, 이 ID를 커서에 넣어 보내세요',
    type: Number,
    example: 0,
  })
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async diaryInfinite(
    @CurrentUser() user,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor', new DefaultValuePipe(0), ParseIntPipe) cursorId: number,
  ) {
    const cursor = cursorId > 0 ? { id: cursorId } : undefined;
    const memberId = user.id;
    return this.diaryService.getDiariesInfinite(memberId, limit, cursor);
  }
}
