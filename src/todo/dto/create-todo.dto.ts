import { IsArray, IsString, IsBoolean, IsOptional, IsDefined } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LocalDate } from 'js-joda';
import { BadRequestException } from '@nestjs/common';

export class CreateTodoDto {
  @ApiProperty({
    example: '운동하기',
    description: '할 일 제목',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'TODO 등록일자',
    example: '2024-01-01',
  })
  @IsDefined()
  @Transform(({ value }) => {
    try {
      return LocalDate.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid date format');
    }
  })
  date: LocalDate;

  @ApiPropertyOptional({
    description: '할 일 반복 여부',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isRepeat?: boolean;

  @ApiPropertyOptional({
    description: '할 일 반복 규칙',
    example: 'FREQ=DAILY',
  })
  @IsOptional()
  @IsString()
  repeatRule?: string;

  @ApiProperty({
    description: 'TODO 반복 종료일자',
    example: '2024-01-01',
  })
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
