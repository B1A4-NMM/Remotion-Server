// src/diary/dto/create-diary.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDiaryDto {
  @IsString()
  @IsNotEmpty()
  text: string; // 줄글 일기
}
