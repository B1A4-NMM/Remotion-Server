import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
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
import { DiaryHomeListRes, DiaryRes } from './dto/diary-home-list.res';
import { DiaryHomeRes } from './dto/diary-home.res';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../upload/s3.service';
import { CreateDiaryRes } from './dto/create-diary.res';
import { ParseLocalDatePipe } from '../pipe/parse-local-date.pipe';
import { LocalDate } from 'js-joda';
import { MemberSummaryRes } from '../member/dto/member-summary.res';
import { UploadService } from '../upload/upload.service';
import { CreateDiaryWithMediaDto } from './dto/create-diary-swagger.dto';
import { InfiniteScrollRes } from './dto/infinite-scroll.res';
import { SearchDiaryRes } from './dto/search-diary.res';
import { DiaryDetailRes } from './dto/diary-detail.res';
import { WrittenDaysDto } from './dto/written-days.dto';
import { InfinitePhotosResDto } from './dto/infinite-photos.res.dto';
import { ConfigService } from '@nestjs/config';

// import { Member } from '../entities/Member.entity';

@Controller('diary')
@ApiBearerAuth('access-token')
@ApiTags('일기')
@UseGuards(AuthGuard('jwt'))
export class DiaryController {
  constructor(
    private readonly diaryService: DiaryService,
    private readonly s3Service: S3Service,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService
  ) {}

  @Post()
  @ApiOperation({ summary: '일기 생성' })
  @ApiResponse({
    status: 201,
    description: '다이어리 생성 완료',
    type: CreateDiaryRes,
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    type: CreateDiaryWithMediaDto,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photo', maxCount: 10 },
      { name: 'audios' },
    ]),
  )
  async create(
    @CurrentUser() user: any,
    @Body() body: CreateDiaryDto,
    @UploadedFiles()
    files: {
      photo?: Express.Multer.File[];
      audios?: Express.Multer.File[];
    },
  ) {
    const env = this.configService.get<string>('MAKE_ENV')
    if (env === 'NO' && (user.id === 'lee' || user.id === 'anne')){
      return
    }

    let imageUrl: string[] | null = null;
    let audioUrl: string | null = null;
    if (files.photo) {
      imageUrl = await this.s3Service.uploadMultipleFiles(files.photo);
    }

    if (files.audios) {
      const result = await this.uploadService.uploadAudiosToS3(files.audios);
      audioUrl = result.urls[0];
    }

    const memberId = user.id;

    const createId = await this.diaryService.createDiary(
      memberId,
      body,
      imageUrl,
      audioUrl,
    );
    return new CreateDiaryRes(createId);
  }

  @Get('date/emotion/:id')
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

  @ApiExcludeEndpoint()
  @ApiOperation({ summary: '자신이 작성한 모든 일기 받기, 무한스크롤 아님 !!' })
  @ApiBody({ type: DiaryHomeListRes })
  @Get()
  async allDiaries(@CurrentUser() user) {
    const memberId = user.id;
    return await this.diaryService.getDiaryList(memberId);
  }

  @ApiOperation({ summary: '자신이 특정 날짜에 작성한 일기들 받기' })
  @ApiQuery({
    name: 'date',
    required: true,
    type: Date,
    description: '조회할 날짜',
    example: '2021-01-01',
  })
  @ApiResponse({ type: [DiaryRes] })
  @Get('date')
  async getDiaryByDate(
    @CurrentUser() user: any,
    @Query('date', ParseLocalDatePipe) date: LocalDate,
  ) {
    const memberId = user.id;
    return await this.diaryService.getDiaryResByDate(memberId, date);
  }

  // @ApiOperation({
  //   summary: '오늘의 일기',
  //   description: '오늘 작성한 일기와 그에 나타난 감정들을 보여줍니다',
  // })
  // @ApiResponse({ type: DiaryHomeRes })
  // @Get('/today')
  // async getTodayDiary(@CurrentUser() user): Promise<DiaryHomeRes> {
  //   const memberId = user.id;
  //   return this.diaryService.getTodayDiariesRes(memberId);
  // }

  @ApiOperation({ summary: '특정 일기 json 데이터 조회' })
  @ApiResponse({
    status: 200,
    description: '일기 분석 결과',
    // schema: DiaryResponseSchema,
    type: DiaryDetailRes,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: '조회할 일기 id',
  })
  @ApiQuery({
    name: 'beforeDiaryCount',
    type: Number,
    description: '감정 스코어를 가져올 일기 갯수, default 10개',
  })
  @Get('json/:id')
  async getDiaryToDetail(
    @CurrentUser() user,
    @Param('id', ParseIntPipe) id: number,
    @Query('beforeDiaryCount', new DefaultValuePipe(5), ParseIntPipe)
    count: number,
  ) {
    const memberId: string = user.id;
    return await this.diaryService.getDiaryDetail(memberId, id, count);
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
  async deleteDiary(@CurrentUser() user: any, @Param('id') id: string) {
    const memberId: string = user.id;
    const env = this.configService.get<string>('MAKE_ENV')
    if (env === 'NO' && (user.id === 'lee' || user.id === 'anne')){
      return
    }
    return await this.diaryService.deleteDiary(memberId, +id);
  }

  @Delete('all')
  async deleteAll(@CurrentUser() user) {
    const memberId: string = user.id;
    return await this.diaryService.deleteAll(memberId);
  }

  @Get('search')
  @ApiOperation({
    summary: '일기 검색',
    description: '키워드를 통해 가장 유사한 문장을 가진 일기들을 조회합니다',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: '검색 키워드',
  })
  @ApiResponse({ type: SearchDiaryRes })
  async diarySearch(@CurrentUser() user: any, @Query('q') q: string) {
    const memberId = user.id;
    return await this.diaryService.getSearchDiary(memberId, q);
  }

  @ApiOperation({
    summary: '일기 전체 무한스크롤 조회',
    description: '무한스크롤을 통해 일기를 조회할 수 있습니다',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 번에 가져올 일기 개수',
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '맨 첫 스크롤을 가져오려면 0 또는 값을 보내지 마세요',
    type: Number,
    example: 0,
  })
  @ApiResponse({ type: InfiniteScrollRes })
  @Get('home')
  async diaryInfinite(
    @CurrentUser() user,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor', new DefaultValuePipe(0), ParseIntPipe) cursorId: number,
  ) {
    const cursor = cursorId;
    const memberId = user.id;
    return this.diaryService.getDiariesInfinite(memberId, limit, cursor);
  }

  @ApiOperation({
    summary: '북마크된 일기 무한스크롤 조회',
    description: '무한스크롤을 통해 북마크된 일기를 조회할 수 있습니다',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '한 번에 가져올 일기 개수',
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '맨 첫 스크롤을 가져오려면 0 또는 값을 보내지 마세요',
    type: Number,
    example: 0,
  })
  @ApiResponse({ type: InfiniteScrollRes })
  @Get('bookmark')
  async bookmarkedDiaryInfinite(
    @CurrentUser() user,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor', new DefaultValuePipe(0), ParseIntPipe) cursorId: number,
  ) {
    const cursor = cursorId;
    const memberId = user.id;
    return this.diaryService.getBookmarkedDiariesInfinite(
      memberId,
      limit,
      cursor,
    );
  }

  @Get('writtenDays')
  @ApiOperation({
    summary: '해당 연월에 일기가 작성된 날짜 조회',
    description: '주어진 연도와 월에 일기가 작성된 날짜(day)들을 반환합니다.',
  })
  @ApiQuery({ name: 'year', required: true, description: '조회할 연도' })
  @ApiQuery({ name: 'month', required: true, description: '조회할 월' })
  @ApiResponse({ status: 200, description: '성공', type: WrittenDaysDto })
  async getWrittenDays(
    @CurrentUser() member: any,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<WrittenDaysDto> {
    return this.diaryService.getWrittenDays(member.id, year, month);
  }

  @Get('/photos')
  @ApiOperation({ summary: '모든 사진 모아보기 (무한 스크롤)' })
  @ApiQuery({ name: 'limit', required: false, description: '한 번에 가져올 사진 개수, default 30' })
  @ApiQuery({ name: 'cursor', required: false, description: '페이지 커서, default 0' })
  @ApiResponse({ 
    status: 200, 
    description: '사진 목록 조회 성공', 
    type: InfinitePhotosResDto 
  })
  async getAllDiaryPhotosInfinite(
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    const cursorNum = cursor ? parseInt(cursor, 10) : undefined;
    return this.diaryService.getAllDiaryPhotosInfinite(
      user.id,
      limit,
      cursorNum,
    );
  }

  @ApiOperation({ summary: '특정 일기 가공 데이터 조회' })
  @ApiResponse({ type: DiaryAnalysisDto })
  @Get(':id')
  async getDiary(@CurrentUser() user, @Param('id', ParseIntPipe) id: number) {
    const memberId: string = user.id;
    return await this.diaryService.getDiary(memberId, id);
  }

  @Patch('bookmark/:id')
  @ApiOperation({ summary: '일기 북마크 토글' })
  @ApiParam({
    name: 'id',
    description: '북마크 토글할 일기의 ID',
    type: 'string',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '북마크 토글 성공',
    schema: {
      properties: {
        id: { type: 'number' },
        isBookmarked: { type: 'boolean' },
      },
    },
  })
  async bookmarkDiary(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const memberId: string = user.id;
    return this.diaryService.toggleDiaryBookmark(memberId, id);
  }
}
