import { ApiProperty } from '@nestjs/swagger';

export class RecommendVideoDto {
  @ApiProperty({ description: '추천된 유튜브 영상 ID', nullable: true })
  videoId: string | null;

  @ApiProperty({ description: '추천 결과 메시지' })
  message: string;
}
