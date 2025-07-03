import { EmotionType } from '../../enums/emotion-type.enum';
import { ApiProperty } from '@nestjs/swagger';

class TargetEmotionRes {
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

  @ApiProperty({
    enum: EmotionType,
    nullable: true,
    description: '관계 대상에 대한 지배적 감정',
  })
  highestEmotion: EmotionType | null;

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