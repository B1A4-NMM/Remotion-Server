// src/diary/dto/create-diary.dto.ts
import { IsString, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiaryDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @Type(() => Date)
  @IsDate()
  writtenDate: Date;




}
