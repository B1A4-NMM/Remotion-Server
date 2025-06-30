// src/diary/dto/create-diary.dto.ts
import { IsString, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
  @IsDate()
  writtenDate: Date;
}
