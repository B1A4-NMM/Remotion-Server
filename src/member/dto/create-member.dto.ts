import { IsEmail, IsEnum, IsNumber, IsString } from 'class-validator';
import { SocialType } from '../../enums/social-type.enum';

export class CreateMemberDto {
  @IsNumber()
  id:string

  @IsEmail()
  email:string

  @IsString()
  nickname:string

  @IsEnum(SocialType)
  socialType:SocialType

}
