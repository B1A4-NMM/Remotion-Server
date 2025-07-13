import { ApiProperty } from '@nestjs/swagger';
import { EmotionType } from '../../enums/emotion-type.enum';

class EmotionDetailDto {
  @ApiProperty({ enum: EmotionType, description: '감정 종류' })
  emotion: EmotionType;

  @ApiProperty({ description: '감정 횟수' })
  count: number;

  @ApiProperty({ description: '감정 강도 합' })
  intensity: number;
}

export class EmotionSummaryByTargetResponseDto {
  @ApiProperty({ description: '날짜' })
  date: string;

  @ApiProperty({ type: [EmotionDetailDto], description: '해당 날짜의 감정 목록' })
  emotions: EmotionDetailDto[];
}
