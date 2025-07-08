import { Controller, Get, Query, NotFoundException, Logger, BadRequestException, Post } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EmotionType } from '../enums/emotion-type.enum'; // EmotionType 임포트

@ApiTags('Youtube')
@Controller('youtube')
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('video')
  @ApiOperation({
    summary: '특정 감정 타입에 해당하는 랜덤 유튜브 영상 ID 가져오기',
  })
  @ApiQuery({
    name: 'emotion',
    description: '감정 타입 (예: 긴장, 불안, 우울)',
    enum: EmotionType,
    required: true,
  }) // enum 타입 명시
  @ApiResponse({
    status: 200,
    description: '성공적으로 랜덤 영상 ID를 반환합니다.',
  })
  @ApiResponse({ status: 400, description: '유효하지 않은 감정 타입입니다.' })
  @ApiResponse({
    status: 404,
    description: '해당 감정 타입에 대한 영상이 없습니다.',
  })
  async getRandomVideoId(
    @Query('emotion') emotionType: EmotionType,
  ): Promise<{ videoId: string }> {
    // 타입 변경
    this.logger.log(
      `Request for random video ID for emotion type: ${emotionType}`,
    );

    // 유효성 검사: emotionType이 EmotionType enum에 속하는지 확인
    if (!Object.values(EmotionType).includes(emotionType)) {
      throw new BadRequestException(
        `Invalid emotion type: ${emotionType}. Must be one of ${Object.values(EmotionType).join(', ')}`,
      );
    }

    const videoId =
      await this.youtubeService.getRandomVideoIdByEmotion(emotionType);

    if (!videoId) {
      throw new NotFoundException(
        `No video found for emotion type: ${emotionType}`,
      );
    }

    return { videoId };
  }

  @Post('getVideo')
  async getVideo() {
   return await this.youtubeService.searchAndStoreVideos()
  }
}