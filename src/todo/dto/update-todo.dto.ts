import { IsOptional, IsBoolean, IsDateString, IsString, IsDefined } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LocalDate } from 'js-joda';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export class UpdateTodoDto {
  //1. 수정할 제목
  @ApiPropertyOptional({
    example: '잠자기',
    description: '변경할 제목',
  })
  @IsOptional()
  @IsString()
  title?: string;

  //2. 수정할 날짜
  @ApiPropertyOptional({
    example: '2025-07-10',
    description: '변경할 날짜 (yyyy-mm-dd)',
  })
  @IsOptional()
  @IsDefined()
  @Transform(({ value }) => {
    try {
      return LocalDate.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid date format');
    }
  })
  @IsDateString()
  date?: LocalDate;

  //3. 완료여부 수정
  @ApiPropertyOptional({
    example: false,
    description: '완료 여부 변경',
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  //3. 반복여부 수정
  @ApiPropertyOptional({
    example: false,
    description: '반복 여부 변경',
  })
  @IsOptional()
  @IsBoolean()
  isRepeat?: boolean;

  //4.반복 규칙 수정 => 혹시 이거 enum 으로 해야하나
  @ApiPropertyOptional({
    example: 'WEEKLY',
    description: '반복 규칙 설정',
  })
  @IsOptional()
  @IsString()
  repeatRule?: string;

  //5.반복 종료 날짜 설정
  @ApiPropertyOptional({
    example: '2025-07-10',
    description: '반복 종료 날짜 (yyyy-mm-dd)',
  })
  @IsOptional()
  @IsDateString()
  @IsDefined()
  @Transform(({ value }) => {
    try {
      return LocalDate.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid date format');
    }
  })
  repeatEndDate?: LocalDate;
}
