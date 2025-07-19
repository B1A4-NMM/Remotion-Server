import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// EmotionInteraction
export class EmotionInteraction {
  @ApiProperty({ type: [String] })
  emotion: string[];

  @ApiProperty({ type: [Number] })
  emotion_intensity: number[];
}

// Person
export class Person {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: EmotionInteraction })
  @Type(() => EmotionInteraction)
  interactions: EmotionInteraction;

  @ApiProperty()
  name_intimacy: number;
}

// ProblemAnalysis
export class ProblemAnalysis {
  @ApiProperty()
  situation: string;

  @ApiProperty()
  approach: string;

  @ApiProperty()
  outcome: string;

  @ApiProperty()
  conflict_response_code: string;
}

// ActivityAnalysis
export class ActivityAnalysis {
  @ApiProperty()
  activity: string;

  @ApiProperty({ type: [Person] })
  @Type(() => Person)
  peoples: Person[];

  @ApiProperty({ type: EmotionInteraction })
  @Type(() => EmotionInteraction)
  self_emotions: EmotionInteraction;

  @ApiProperty({ type: EmotionInteraction })
  @Type(() => EmotionInteraction)
  state_emotions: EmotionInteraction;

  @ApiProperty({ type: [ProblemAnalysis] })
  @Type(() => ProblemAnalysis)
  problem: ProblemAnalysis[];

  @ApiProperty()
  strength: string;
}

// Reflection
export class Reflection {
  @ApiProperty({ type: [String] })
  achievements: string[];

  @ApiProperty({ type: [String] })
  shortcomings: string[];

  @ApiProperty()
  tomorrow_mindset: string;

  @ApiProperty({ type: [String] })
  todo: string[];
}

// DiaryAnalysis
export class DiaryAnalysisJson {
  @ApiProperty({ type: [ActivityAnalysis] })
  @Type(() => ActivityAnalysis)
  activity_analysis: ActivityAnalysis[];

  @ApiProperty({ type: Reflection })
  @Type(() => Reflection)
  reflection: Reflection;
}
