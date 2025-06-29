import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmotionAnalysisDto {
  @ApiProperty({example: "기쁨"})
  @IsString()
  emotion:string

  @ApiProperty({example: ["애정", "분노"]})
  @IsString()
  subEmotion:string[] = []

  @ApiProperty({example: 7})
  @IsNumber()
  intensity:number
}

export class PeopleAnalysisDto {
  @ApiProperty({example: "김민수"})
  @IsString()
  name:string

  @ApiProperty({type: EmotionAnalysisDto})
  @ValidateNested()
  @Type(() => EmotionAnalysisDto)
  feel:EmotionAnalysisDto
}

export class ActivityAnalysisDto {
  @ApiProperty({example: "프로젝트 작업"})
  @IsString()
  activityTitle:string
}

export class DiaryAnalysisDto {
  @ApiProperty({example: '오늘 하루 회고'})
  @IsString()
  title: string;

  @ApiProperty({example: '오늘은 출근하고 개발하다가 커피 마셨다'})
  @IsString()
  content: string;

  @ApiProperty({type: [PeopleAnalysisDto]})
  @ValidateNested()
  @Type(() => PeopleAnalysisDto)
  people: PeopleAnalysisDto[] = []

  @ApiProperty({type: [ActivityAnalysisDto]})
  @ValidateNested()
  @Type(() => ActivityAnalysisDto)
  activity: ActivityAnalysisDto[] = []

}
