import { ApiProperty } from '@nestjs/swagger';
import { EmotionScoreDto } from './emotion-score.dto';

/**
 * 여러 개의 일기 감정 점수 정보를 담는 래퍼 DTO
 */
export class EmotionScoresResDto {
  @ApiProperty({ type: [EmotionScoreDto], description: '일기별 감정 점수 목록' })
  scores: EmotionScoreDto[];

  constructor(scores: EmotionScoreDto[]) {
    this.scores = scores;
  }
}
