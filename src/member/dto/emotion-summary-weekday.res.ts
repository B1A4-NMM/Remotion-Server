import { EmotionType } from '../../enums/emotion-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class Emotions {
  @ApiProperty({ enum: EmotionType, description: '감정 종류' })
  emotion: EmotionType;

  @ApiProperty({ description: '나타난 횟수' })
  count: number;
}

export class EmotionSummaryWeekdayRes {
  @ApiProperty({ type: [Emotions], description: '월요일 감정 목록' })
  monday: Emotions[] = [];

  @ApiProperty({ type: [Emotions], description: '화요일 감정 목록' })
  tuesday: Emotions[] = [];

  @ApiProperty({ type: [Emotions], description: '수요일 감정 목록' })
  wednesday: Emotions[] = [];

  @ApiProperty({ type: [Emotions], description: '목요일 감정 목록' })
  thursday: Emotions[] = [];

  @ApiProperty({ type: [Emotions], description: '금요일 감정 목록' })
  friday: Emotions[] = [];

  @ApiProperty({ type: [Emotions], description: '토요일 감정 목록' })
  saturday: Emotions[] = [];

  @ApiProperty({ type: [Emotions], description: '일요일 감정 목록' })
  sunday: Emotions[] = [];
}