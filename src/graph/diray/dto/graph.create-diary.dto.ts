import { IsDateString, IsString } from 'class-validator';

export class CreateGraphDiaryDto {
  @IsString()
  author_id: string;
  @IsDateString()
  written_date: string;
  @IsString()
  content: string;
  @IsString()
  title: string;
  @IsString()
  weather: string;
  @IsString()
  photo_path: string;
  @IsString()
  group_id: string;
}
