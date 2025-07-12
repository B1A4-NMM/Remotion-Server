import { ApiProperty } from '@nestjs/swagger';
import { DiaryRes } from './diary-home-list.res';

export class SearchDiaryRes {
  @ApiProperty({ type: [DiaryRes], description: '일기 목록' })
  diaries: DiaryRes[] = [];

  @ApiProperty({ example: 10, description: '검색 일기 개수' })
  totalCount: number;
}
