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
      additionalProperties: { type: 'number' },
      example: { 창의성: 1, 유머: 2 },
    })
    detailCount: Record<string, number>;
  
    constructor(typeCount: Record<string, number>, detailCount: Record<string, number>) {
      this.typeCount = typeCount;
      this.detailCount = detailCount;
    }
  }
  