import { DiaryHomeListRes } from './diary-home-list.res';
import { ApiProperty } from '@nestjs/swagger';

export class InfiniteScrollRes {
  @ApiProperty({ type: DiaryHomeListRes, description: '일기 목록 아이템' })
  item: DiaryHomeListRes;

  @ApiProperty({ example: true, description: '다음 페이지 존재 여부' })
  hasMore: boolean;

  @ApiProperty({
    example: 10,
    description: '다음 페이지 커서값',
    nullable: true,
  })
  nextCursor: number | null;

  constructor(item: DiaryHomeListRes, hasMore: boolean, nextCursor: number | null) {
    this.item = item;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
  }
}
