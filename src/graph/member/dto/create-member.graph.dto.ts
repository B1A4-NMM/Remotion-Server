import { IsString } from 'class-validator';

export class CreateMemberGraphDto {
  @IsString()
  nickname: string
}