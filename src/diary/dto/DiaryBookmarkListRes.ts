import { ApiProperty } from '@nestjs/swagger';
import { DiaryRes } from './diary-home-list.res';

export class DiaryBookmarkListRes {
  @ApiProperty({ type: [DiaryRes], description: '일기 목록' })
  diaries: DiaryRes[] = [];

  @ApiProperty({ example: 10, description: '북마크된 일기의 수' })
  totalDiaryCount: number;
}