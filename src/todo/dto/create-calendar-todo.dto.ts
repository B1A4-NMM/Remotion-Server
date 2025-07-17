import { LocalDate } from 'js-joda';
import { IsDefined, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCalendarTodoDto {
  @ApiProperty({
    description: '할 일 내용',
    example: '운동하기',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: '할 일 날짜 (yyyy-MM-dd)',
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
}
