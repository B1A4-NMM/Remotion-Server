import { ApiProperty } from '@nestjs/swagger';
//import { StrengthCountMapDto } from './strength-count-map.dto';

export class GetStrengthsResponseDto {
    @ApiProperty({
      type: 'object',
      additionalProperties: { type: 'number' },
      example: { 지혜: 3, 용기: 2 },
    })
    typeCount: Record<string, number>;
  
    @ApiProperty({
      type: 'object',
      additionalProperties: 
      {
        type: 'object',
        additionalProperties: { type: 'number' },
      },
      example: {
        지혜: {
          창의성: 1,
          호기심: 2,
        },
        초월: {
          유머: 2,
        },
      },
      description:'강점 유형별 상세 강점 카운트',
    })
    detailCount: Record<string,Record<string, number>>;
  
    constructor(typeCount: Record<string, number>, 
      detailCount: Record<string,Record<string, number>>,) {
      this.typeCount = typeCount;
      this.detailCount = detailCount;
    }
  }
  