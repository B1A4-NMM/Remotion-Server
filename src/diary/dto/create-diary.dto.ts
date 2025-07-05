// src/diary/dto/create-diary.dto.ts
import { IsString, IsNotEmpty, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Weather } from '../../enums/weather.enum';
import { BadRequestException } from '@nestjs/common';

export class CreateDiaryDto {
  @ApiProperty({
    description: '일기 내용',
    example: '오늘은 좋은 하루였다.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: '일기 작성일',
    example: '2024-01-01',
  })
  @Type(() => Date)
  @Transform(({ value }) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new BadRequestException('Invalid date format');
    return date;
  })
  @IsDate()
  writtenDate: Date;

  @ApiProperty({
    description: '날씨, 안보내도 됨',
    example: 'SUNNY'
  })
  @IsOptional()
  @IsEnum(Weather, {
    message: `날씨는 ${Object.values(Weather).join(', ')} 중 하나여야 합니다.`,
  })
  @Transform(({ value }) => value ?? Weather.NONE)
  weather: Weather;
}
