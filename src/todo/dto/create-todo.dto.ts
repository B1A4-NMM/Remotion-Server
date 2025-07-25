import { IsArray, IsString, IsBoolean, IsOptional, IsDefined, isString } from 'class-validator';
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

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  isRepeat?: boolean;

  @IsOptional()
  @IsString()
  repeatRule?: string;

  @IsOptional()
  @IsString()
  repeatEndDate?: string;
}
