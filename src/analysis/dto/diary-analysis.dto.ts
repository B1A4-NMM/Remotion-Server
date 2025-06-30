import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmotionType } from '../../enums/emotion-type.enum';

export class EmotionAnalysisDto {
  @ApiProperty({example: "기쁨"})
  @IsString()
  emotionType:EmotionType

  @ApiProperty({example: 7})
  @IsNumber()
  intensity:number
}

export class PeopleAnalysisDto {
  @ApiProperty({example: "김민수"})
  @IsString()
  name:string

  @ApiProperty({type: [EmotionAnalysisDto]})
  @ValidateNested({each: true})
  @Type(() => EmotionAnalysisDto)
  feel:EmotionAnalysisDto[] = []
}

export class ActivityAnalysisDto {
  @ApiProperty({example: "프로젝트 작업"})
  @IsString()
  activityTitle:string
}

export class TodoResDto {
  @ApiProperty({example: "빨래하기"})
  @IsString()
  content:string
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

  @ApiProperty({type: [TodoResDto]})
  @ValidateNested()
  @Type(() => TodoResDto)
  todos: TodoResDto[] = []

}
