import { ApiProperty } from '@nestjs/swagger';

export class EmotionItemDto {
  @ApiProperty({ example: '행복' })
  emotion: string;

  @ApiProperty({ example: 0.82 })
  intensity: number;
}
