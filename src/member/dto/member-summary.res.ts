import { EmotionBase, EmotionGroup } from '../../enums/emotion-type.enum';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class EmotionGroups {
  @ApiProperty({ enum: EmotionGroup })
  emotion: EmotionGroup;

  @ApiProperty({ example: 5 })
  intensity: number;
}

class PerDate {
  @ApiProperty({ example: '2024-01-01' })
  date: Date;

  @ApiProperty({ type: [EmotionGroups] })
  emotions: EmotionGroups[];
}

export class MemberSummaryRes {
  @ApiProperty({ example: false })
  depressionWarning: boolean;

  @ApiProperty({ example: false })
  stressWarning: boolean;

  @ApiProperty({ example: false })
  anxietyWarning: boolean;

  @ApiProperty({ type: [PerDate] })
  emotionsPerDate: PerDate[] = [];

  @ApiProperty({ example: 7 })
  period: number;
}
