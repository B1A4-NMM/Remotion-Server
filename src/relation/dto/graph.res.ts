import { RelationGraphDto } from './relation-graph.dto';
import { EmotionType } from '../../enums/emotion-type.enum';
import { ApiProperty } from '@nestjs/swagger';

class GraphEmotionRes {
  @ApiProperty({
    enum: EmotionType,
    description: '감정 타입',
  })
  emotion: EmotionType;

  @ApiProperty({
    type: Number,
    description: '감정 강도',
  })
  intensity: number;
}

export class GraphRes {
  @ApiProperty({
    type: [GraphEmotionRes],
    description: '오늘의 감정 목록',
  })
  todayMyEmotions: GraphEmotionRes[] = [];

  @ApiProperty({
    type: RelationGraphDto,
    description: '관계 그래프 데이터',
  })
  relations: RelationGraphDto;
}