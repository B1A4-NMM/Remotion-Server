import { EmotionType } from '../../enums/emotion-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

class EmotionDetailDto {
  @ApiProperty({ enum: EmotionType, description: '감정 종류' })
  emotion: EmotionType;

  @ApiProperty({ description: '감정 강도 합' })
  totalIntensity: number;

  @ApiProperty({ description: '감정 횟수' })
  totalCount: number;
}

class TargetEmotionRes {
  @ApiProperty({
    type: Number,
    description: '대상 id',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    description: '관계 대상의 이름',
  })
  name: string;

  @ApiProperty({
    type: Number,
    description: '관계 대상과의 친밀도',
  })
  affection: number;

  @ApiProperty({ type: [EmotionDetailDto], description: '해당 대상의 감정 목록' })
  emotions: EmotionDetailDto[];

  @ApiProperty({
    type: Number,
    description: '언급 수'
  })
  count: number;
}

export class RelationGraphDto {
  @ApiProperty({
    type: [TargetEmotionRes],
    description: '관계 대상 목록',
  })
  relations: TargetEmotionRes[] = [];
}