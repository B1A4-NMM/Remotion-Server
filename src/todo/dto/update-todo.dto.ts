import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTodoDto {
  @ApiPropertyOptional({
    example: '2025-07-10',
    description: '변경할 날짜 (yyyy-mm-dd)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: false,
    description: '반복 여부 변경',
  })
  @IsOptional()
  @IsBoolean()
  isRepeat?: boolean;
}
