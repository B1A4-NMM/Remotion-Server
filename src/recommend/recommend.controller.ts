import { Controller, Get, Query, UseGuards, Logger, ParseIntPipe } from '@nestjs/common'; // ParseIntPipe 추가
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { Member } from '../entities/Member.entity';
import { RecommendService } from './recommend.service';
import { RecommendVideoDto } from './dto/recommend-video.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('추천')
@Controller('recommend')
export class RecommendController {
  private readonly logger = new Logger(RecommendController.name);

  constructor(private readonly recommendService: RecommendService) {}

  @Get('video')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 감정 기반 유튜브 영상 추천' })
  @ApiQuery({ name: 'period', description: '감정 집계 기간 (오늘로부터 몇 일 전까지, 숫자만 입력)', type: Number, required: true }) // type을 Number로 변경
  @ApiResponse({ status: 200, description: '추천 영상 ID 반환', type: RecommendVideoDto })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 400, description: '잘못된 기간 형식 또는 감정 데이터 없음' })
  async getRecommendedVideo(
    @CurrentUser() member: Member,
    @Query('period', ParseIntPipe) period: number, // ParseIntPipe 추가
  ): Promise<{ videoId: string[]; message: string }> {
    this.logger.log(`User ${member.id} requested recommended video for period: ${period} days`);
    const result = await this.recommendService.getRecommendedVideoId(member, period);

    if (!result?.videoId?.length) {
      return { videoId: [], message: 'No recommended video found for the given period and emotions.' };
    }

    let res = new RecommendVideoDto();
    res.videoId = result.videoId;
    res.emotion = result.mostFrequentEmotion;
    res.message = `${period}일 내의 ${result.mostFrequentEmotion} 추천 영상입니다`;
    return res;
  }
}