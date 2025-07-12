import { Exclude, Expose, Type } from 'class-transformer';
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

  @ApiProperty({example: 1, description: '언급수'})
  @IsNumber()
  count:number;
}

export class ActivityAnalysisDto {
  @ApiProperty({example: "프로젝트 작업"})
  @IsString()
  activityContent:string

  @ApiProperty({example:'강한 정신력'})
  @IsString()
  strength:string | null | undefined

}

export class TodoAnalysisDto {
  @ApiProperty({example: "빨래하기"})
  @IsString()
  Todocontent:string
}

/**
 * 일기 조회 시 결과들을 보내주는 DTO
 * RETURN id, title, content, people, photo_path, activity, todos
 */
export class DiaryAnalysisDto {
  @ApiProperty({example: 1})
  @IsNumber()
  id: number;

  @ApiProperty({example: '오늘 하루 회고'})
  @IsString()
  title: string;

  @ApiProperty({example: 'https://remotion-photo.s3.ap-northeast-2.amazonaws.com/bcdc2b34-a81e-4d51-be65-d14c4423e193.jpg'})
  @IsString()
  photo_path?: string[] | null;

  @ApiProperty({example: '오늘은 출근하고 개발하다가 커피 마셨다'})
  @IsString()
  content: string; 
  
  @ApiProperty({type: [PeopleAnalysisDto]})
  @ValidateNested()
  @Type(() => PeopleAnalysisDto)
  people: PeopleAnalysisDto[] = []

  @ApiProperty({type: [EmotionAnalysisDto]})
  @ValidateNested()
  @Type(() => EmotionAnalysisDto)
  selfEmotion: EmotionAnalysisDto[] = []

  @ApiProperty({type: [EmotionAnalysisDto]})
  @ValidateNested()
  @Type(() => EmotionAnalysisDto)
  stateEmotion: EmotionAnalysisDto[] = []

  @ApiProperty({type: [ActivityAnalysisDto]})
  @ValidateNested()
  @Type(() => ActivityAnalysisDto)
  activity: ActivityAnalysisDto[] = []

  @ApiProperty({type: [TodoAnalysisDto]})
  @ValidateNested()
  @Type(() => TodoAnalysisDto)
  todos: TodoAnalysisDto[] = []

  @Exclude()
  achievements: string[] = []

  @Exclude()
  shortComings: string[] = []

}
