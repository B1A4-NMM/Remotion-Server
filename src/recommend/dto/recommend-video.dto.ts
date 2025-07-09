import { ApiProperty } from '@nestjs/swagger';
import { EmotionType } from '../../enums/emotion-type.enum';

export class RecommendVideoDto {
  @ApiProperty({ description: '추천된 유튜브 영상 ID', nullable: true })
  videoId: string[];

  @ApiProperty({description:'가장 큰 감정', nullable: true})
  emotion:EmotionType

  @ApiProperty({ description: '추천 결과 메시지' })
  message: string;
}
