
import { ApiProperty } from '@nestjs/swagger';

export class InfinitePhotosResDto {
  @ApiProperty({
    description: '사진 URL 목록',
    type: [String],
  })
  photos: string[];

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    type: Boolean,
  })
  hasMore: boolean;

  @ApiProperty({
    description: '다음 페이지를 위한 커서',
    type: Number,
    nullable: true,
  })
  nextCursor: number | null;

  constructor(photos: string[], hasMore: boolean, nextCursor: number | null) {
    this.photos = photos;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
  }
}
