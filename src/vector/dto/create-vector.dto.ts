import { IsDateString, IsString } from 'class-validator';

export class CreateVectorDto {
  @IsDateString()
  date: string;

  @IsString()
  text: string;
}