import { EmotionGroup } from '../../enums/emotion-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ActivityEmotionSummaryRes {
  @ApiProperty({ description: '행동 ID' })
  activityId: number;

  @ApiProperty({ description: '행동 내용' })
  activityContent: string;

  @ApiProperty({ enum: EmotionGroup, description: '감정 그룹' })
  emotion: EmotionGroup;

  @ApiProperty({ description: '총 감정 강도' })
  totalIntensity: number;

  @ApiProperty({ description: '해당 감정이 나타난 횟수' })
  count: number;

  @ApiProperty({ description: '정규화된 수치 0~100' })
  percentage!: number;
}
