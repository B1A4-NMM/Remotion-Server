import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe, Param, DefaultValuePipe,
} from '@nestjs/common'; // ParseIntPipe 추가
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { Member } from '../entities/Member.entity';
import { RecommendService } from './recommend.service';
import { RecommendVideoDto } from './dto/recommend-video.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth, ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { LocalDate } from 'js-joda';
import { LocalDateTransformer } from '../util/local-date.transformer';
import { RecommendCommentRes } from './dto/recommend-comment.res';

@ApiTags('추천')
@Controller('recommend')
@UseGuards(AuthGuard('jwt'))
export class RecommendController {
  private readonly logger = new Logger(RecommendController.name);

  constructor(private readonly recommendService: RecommendService) {}

  @Get('video')
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 감정 기반 유튜브 영상 추천' })
  @ApiQuery({
    name: 'period',
    description: '감정 집계 기간 (오늘로부터 몇 일 전까지, 숫자만 입력)',
    type: Number,
    required: true,
  }) // type을 Number로 변경
  @ApiResponse({
    status: 200,
    description: '추천 영상 ID 반환',
    type: RecommendVideoDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({
    status: 400,
    description: '잘못된 기간 형식 또는 감정 데이터 없음',
  })
  async getRecommendedVideo(
    @CurrentUser() member: Member,
    @Query('period',  new DefaultValuePipe(10), ParseIntPipe) period: number, // ParseIntPipe 추가
  ): Promise<{ videoId: string[]; message: string }> {
    this.logger.log(
      `User ${member.id} requested recommended video for period: ${period} days`,
    );
    const result = await this.recommendService.getRecommendedVideoId(
      member,
      period,
    );

    if (!result?.videoId?.length) {
      return {
        videoId: [],
        message:
          'No recommended video found for the given period and emotions.',
      };
    }

    let res = new RecommendVideoDto();
    res.videoId = result.videoId;
    res.emotion = result.mostFrequentEmotion;
    res.message = `${period}일 내의 ${result.mostFrequentEmotion} 추천 영상입니다`;
    return res;
  }

  @ApiOperation({
    summary: '요일별 감정 분석 후 행동 추천',
    description: '각 요일별로 어떤 감정이 크게 들었고, 감정에 따른 행동을 추천하는 멘트를 반환합니다'
  })
  @ApiResponse({
    type: RecommendCommentRes,
    description: '추천된 멘트와 추천된 행동이 있던 일기 id를 반환합니다'
  })
  @Get('activity/weekday/today')
  async getRecommendedActivity(@CurrentUser() user: any) {
    const memberId: string = user.id;
    return this.recommendService.getCommentByWeekdayOfToday(memberId);
  }

  @ApiOperation({
    summary: '요일별 감정 분석 후 행동 추천',
    description: '각 요일별로 어떤 감정이 크게 들었고, 감정에 따른 행동을 추천하는 멘트를 반환합니다'
  })
  @ApiResponse({
    type: RecommendCommentRes,
    description: '추천된 멘트와 추천된 행동이 있던 일기 id를 반환합니다'
  })
  @Get('activity/weekday/tomorrow')
  async getRecommendedActivityTomorrow(@CurrentUser() user: any) {
    const memberId: string = user.id;
    return this.recommendService.getCommentByWeekdayOfTomorrow(memberId);
  }

  @ApiOperation({
    summary: '요일별 감정 분석 후 행동 추천',
    description: '각 요일별로 어떤 감정이 크게 들었고, 감정에 따른 행동을 추천하는 멘트를 반환합니다'
  })
  @ApiExcludeEndpoint()
  @Get('activity/weekday/:date')
  async getRecommendedActivityDate(@CurrentUser() user: any, @Param('date') date: string) {
    const memberId: string = user.id;
    return this.recommendService.getCommentByWeekday(memberId, LocalDate.parse(date));
  }
}
