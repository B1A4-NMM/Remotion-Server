import { ActivityEmotionSummaryRes } from './activity-emotion-summary.res';
import { TargetEmotionSummaryRes } from './target-emotion-summary.res';
import { EmotionSummaryPeriodRes } from './emotion-summary-period.res';
import { ApiProperty } from '@nestjs/swagger';

export class EmotionAnalysisPeriodRes {
  @ApiProperty({
    type: [ActivityEmotionSummaryRes],
    description: '활동 감정 요약',
  })
  activities: ActivityEmotionSummaryRes[] = [];

  @ApiProperty({
    type: [TargetEmotionSummaryRes],
    description: '타겟별 감정 요약',
  })
  people: TargetEmotionSummaryRes[] = [];

  @ApiProperty({
    type: [EmotionSummaryPeriodRes],
    description: '기간별 감정 요약',
  })
  date: EmotionSummaryPeriodRes[] = [];
}