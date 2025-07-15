import { ApiProperty } from '@nestjs/swagger';

export class ReflectionDto {
  @ApiProperty({ type: [String] })
  achievements: string[];

  @ApiProperty({ type: [String] })
  shortcomings: string[];

  @ApiProperty({ type: [String] })
  todo: string[];
}


export class ProblemDto {
  @ApiProperty()
  situation: string;

  @ApiProperty()
  approach: string;

  @ApiProperty()
  outcome: string;

  @ApiProperty()
  decision_code: string;

  @ApiProperty()
  conflict_response_code: string;
}


export class EmotionDataDto {
  @ApiProperty({ type: [String] })
  emotion: string[];

  @ApiProperty({ type: [Number] })
  emotion_intensity: number[];
}

export class InteractionsDto {
  @ApiProperty({ type: [String] })
  emotion: string[];

  @ApiProperty({ type: [Number] })
  emotion_intensity: number[];
}

export class PeopleDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: InteractionsDto })
  interactions: InteractionsDto;

  @ApiProperty({ description: '친밀도 (0~1 사이 문자열)' })
  name_intimacy: string;
}

export class ActivityAnalysisDto {
  @ApiProperty()
  activity: string;

  @ApiProperty({ type: [PeopleDto] })
  peoples: PeopleDto[];

  @ApiProperty({ type: EmotionDataDto })
  self_emotions: EmotionDataDto;

  @ApiProperty({ type: EmotionDataDto })
  state_emotions: EmotionDataDto;

  @ApiProperty({ type: [ProblemDto] })
  problem: ProblemDto[];

  @ApiProperty()
  strength: string;
}

export class DiaryAnalysisJsonDto {
  @ApiProperty({ type: [ActivityAnalysisDto] })
  activity_analysis: ActivityAnalysisDto[];

  @ApiProperty({ type: ReflectionDto })
  reflection: ReflectionDto;
}