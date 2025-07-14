import { ApiProperty } from '@nestjs/swagger';
import { DiaryBookmarkListRes } from './DiaryBookmarkListRes';

export class InfiniteBookmarkScrollRes {
  @ApiProperty({ type: DiaryBookmarkListRes, description: '일기 목록 아이템' })
  item: DiaryBookmarkListRes;

  @ApiProperty({ example: true, description: '다음 페이지 존재 여부' })
  hasMore: boolean;

  @ApiProperty({
    example: 10,
    description: '다음 페이지 커서값',
    nullable: true,
  })
  nextCursor: number | null;

  constructor(item: DiaryBookmarkListRes, hasMore: boolean, nextCursor: number | null) {
    this.item = item;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
  }
}
