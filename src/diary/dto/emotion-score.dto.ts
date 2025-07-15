import { ApiProperty } from '@nestjs/swagger';
import { LocalDate } from 'js-joda';

/**
 * 일기별 감정 점수 정보를 담는 DTO
 */
export class EmotionScoreDto {
  @ApiProperty({ description: '일기 ID' })
  diaryId: number;

  @ApiProperty({ description: '일기 작성일' })
  writtenDate: LocalDate;

  @ApiProperty({ description: '감정 점수 합산' })
  intensitySum: number;

  constructor(diaryId: number, writtenDate: LocalDate, intensitySum: number) {
    this.diaryId = diaryId;
    this.writtenDate = writtenDate;
    this.intensitySum = intensitySum;
  }
}
