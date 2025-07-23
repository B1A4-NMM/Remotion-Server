
import { ApiProperty } from '@nestjs/swagger';
import { PhotoDetailDto } from './photo-detail.dto';

export class InfinitePhotosResDto {
  @ApiProperty({
    description: '사진 상세 정보 목록',
    type: [PhotoDetailDto],
  })
  photos: PhotoDetailDto[];

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

  constructor(photos: PhotoDetailDto[], hasMore: boolean, nextCursor: number | null) {
    this.photos = photos;
    this.hasMore = hasMore;
    this.nextCursor = nextCursor;
  }
}
