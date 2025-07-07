import { ApiProperty } from '@nestjs/swagger';
import { EmotionItemDto } from './emotion-item.dto';

export class EmotionByDateDto {
  @ApiProperty({ example: '2025-07-01' })
  date: string;

  @ApiProperty({ type: [EmotionItemDto] })
  emotions: EmotionItemDto[];
}
