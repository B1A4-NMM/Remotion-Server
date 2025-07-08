import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDefined,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Weather } from '../../enums/weather.enum';
import { BadRequestException } from '@nestjs/common';
import { LocalDate } from 'js-joda';

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
  @IsDefined()
  @Transform(({ value }) => {
    try {
      return LocalDate.parse(value);
    } catch (e) {
      throw new BadRequestException('Invalid date format');
    }
  })
  writtenDate: LocalDate;

  @ApiProperty({
    description: '날씨, 안보내도 됨',
    example: 'SUNNY',
  })
  @IsOptional()
  @IsEnum(Weather, {
    message: `날씨는 ${Object.values(Weather).join(', ')} 중 하나여야 합니다.`,
  })
  @Transform(({ value }) => value ?? Weather.NONE)
  weather: Weather;

  @ApiProperty({
    description: '위도, 위치를 추가하지 않았다면 보내지 않아도 됩니다',
    example: 37.5665,
  })
  @IsOptional()
  latitude: number;

  @ApiProperty({
    description: '경도, 위치를 추가하지 않았다면 보내지 않아도 됩니다',
    example: 126.978,
  })
  @IsOptional()
  longitude: number;
}
