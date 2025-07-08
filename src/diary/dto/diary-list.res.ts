import { EmotionType } from '../../enums/emotion-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { LocalDate } from 'js-joda';

export class DiaryRes {
  @ApiProperty({ example: 1, description: '일기 ID' })
  diaryId: number;

  @ApiProperty({ example: '커피를 마시며 여유로웠던 하루', description: '일기 제목' })
  title: string;

  @ApiProperty({ example: '2023-12-25', description: '일기 작성일' })
  writtenDate: LocalDate;

  @ApiProperty({ example: '아 코딩하기 귀찮다', description: '일기 내용' })
  content: string

  @ApiProperty({
    type: [String],
    enum: EmotionType,
    example: ['행복', '기쁨'],
    description: '일기에 포함된 감정들',
  })
  emotions: EmotionType[] = [];

  @ApiProperty({
    type: [String],
    example: ['김민수', '이영희'],
    description: '일기에 포함된 대상들',
  })
  targets: string[] = [];
}

export class DiaryListRes {
  @ApiProperty({ type: [DiaryRes], description: '일기 목록' })
  diaries: DiaryRes[] = [];
}