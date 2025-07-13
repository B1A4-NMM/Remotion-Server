import { EmotionType } from '../../enums/emotion-type.enum';
import { DiaryRes } from './diary-home-list.res';
import { ApiProperty } from '@nestjs/swagger';

export class EmotionRes {
  @ApiProperty({ enum: EmotionType, example: '행복', description: '감정 종류' })
  emotion: EmotionType;

  @ApiProperty({ example: 5, description: '감정 강도' })
  intensity: number;
}

export class DiaryHomeRes {
  @ApiProperty({ type: [EmotionRes], description: '이 날의 감정 목록' })
  todayEmotions: EmotionRes[] = [];

  @ApiProperty({ type: [DiaryRes], description: '이 날 작성한 일기 목록' })
  todayDiaries: DiaryRes[] = [];
}