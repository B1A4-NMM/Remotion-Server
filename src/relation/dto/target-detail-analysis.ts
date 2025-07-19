import { EmotionSummaryByTargetResponseDto } from '../../emotion/dto/emotion-summary-by-target.res.dto';
import { DiaryRes } from '../../diary/dto/diary-home-list.res';
import { Target } from '../../entities/Target.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TargetActivityRes {
  content:string
  count:number
}

export class TargetDetailAnalysis {
  @ApiProperty({ description: '대상 ID' })
  targetId: number;

  @ApiProperty({ description: '대상 이름' })
  targetName: string;

  @ApiProperty({ description: '친밀도 점수, 기본은 30점', example: 30 })
  closenessScore: number

  @ApiProperty({
    type: [EmotionSummaryByTargetResponseDto],
    description: '대상별 감정 요약 목록',
  })
  emotions: EmotionSummaryByTargetResponseDto[] = [];

  @ApiProperty({ type: [DiaryRes], description: '대상이 포함된 일기 목록' })
  diaries: DiaryRes[] = [];

  @ApiProperty({ type: [TargetActivityRes], description: '대상이 나타난 활동 클러스터' })
  activities: TargetActivityRes[] = [];

  constructor(
    target: Target,
    emotions: EmotionSummaryByTargetResponseDto[],
    diaries: DiaryRes[],
    activities: TargetActivityRes[],
    bonusScore: number,
  ) {
    this.targetId = target.id;
    this.targetName = target.name;
    this.emotions = emotions;
    this.diaries = diaries;
    this.activities = activities;
    this.closenessScore = target.closenessScore + bonusScore;
  }
}
