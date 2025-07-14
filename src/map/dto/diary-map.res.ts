import { ApiProperty } from '@nestjs/swagger';

export class DiaryMapInfo {
  @ApiProperty({ description: '위도' })
  latitude: number;

  @ApiProperty({ description: '경도' })
  longitude: number;

  @ApiProperty({ description: '일기 ID' })
  diaryId: number;

  @ApiProperty({ description: '사진 경로' })
  photo_path: string | null;

  @ApiProperty({ description: '일기 내용, 100자만 표시됩니다' })
  content: string;
}

export class DiaryMapRes {
  @ApiProperty({ type: [DiaryMapInfo], description: '지도에 표시할 일기 목록' })
  result: DiaryMapInfo[] = [];
}
