import { EmotionSummaryByTargetResponseDto } from '../../emotion/dto/emotion-summary-by-target.res.dto';
import { DiaryRes } from '../../diary/dto/diary-home-list.res';
import { Target } from '../../entities/Target.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TargetDetailAnalysis {
  @ApiProperty({ description: '대상 ID' })
  targetId: number;

  @ApiProperty({ description: '대상 이름' })
  targetName: string;

  @ApiProperty({
    type: [EmotionSummaryByTargetResponseDto],
    description: '대상별 감정 요약 목록',
  })
  emotions: EmotionSummaryByTargetResponseDto[] = [];

  @ApiProperty({ type: [DiaryRes], description: '대상이 포함된 일기 목록' })
  diaries: DiaryRes[] = [];

  constructor(
    target: Target,
    emotions: EmotionSummaryByTargetResponseDto[],
    diaries: DiaryRes[],
  ) {
    this.targetId = target.id;
    this.targetName = target.name;
    this.emotions = emotions;
    this.diaries = diaries;
  }
}
