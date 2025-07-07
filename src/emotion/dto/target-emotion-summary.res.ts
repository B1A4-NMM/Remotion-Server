import { ApiProperty } from '@nestjs/swagger';
import { EmotionGroup, EmotionType } from '../../enums/emotion-type.enum';

export class TargetEmotionSummaryRes {
  @ApiProperty({ description: '대상 ID' })
  targetId: number;

  @ApiProperty({ description: '대상 이름' })
  targetName: string;

  @ApiProperty({ description: '감정 그룹', enum: EmotionGroup })
  emotion: EmotionGroup;

  @ApiProperty({ description: '감정 강도의 총합' })
  totalIntensity: number;

  @ApiProperty({ description: '감정 발생 횟수' })
  count: number;
}
