import { EmotionGroup } from '../../enums/emotion-type.enum';
import { LocalDate } from 'js-joda';
import { ApiProperty } from '@nestjs/swagger';

export class EmotionSummaryPeriodRes {
  @ApiProperty({ description: '날짜', example: '2024-01-01' })
  date: LocalDate;
  @ApiProperty({ description: '감정 분류 그룹', enum: EmotionGroup })
  emotionGroup: EmotionGroup;
  @ApiProperty({ description: '강도 합계', example: 3 })
  intensity: number;
  @ApiProperty({ description: '해당 감정 개수', example: 1 })
  count: number;
}
