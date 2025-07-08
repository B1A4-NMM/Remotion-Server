// src/member/dto/character-response.dto.ts (예시 경로)

import { ApiProperty } from '@nestjs/swagger';

export class CharacterResponseDto {
  @ApiProperty({
    example: '호랑이',
    description: '분석된 캐릭터 동물 이름',
  })
  character: string;
}
