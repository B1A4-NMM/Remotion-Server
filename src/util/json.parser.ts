import { EmotionType } from '../enums/emotion-type.enum';

export interface CombinedEmotion {
  emotion: EmotionType;
  intensity: number;
}

export interface EmotionInteraction {
  emotion: string[];
  emotion_intensity: number[];
}

export interface Person {
  name: string;
  interactions: EmotionInteraction;
  name_intimacy: number;
}

export interface ProblemAnalysis {
  situation: string;
  approach: string;
  outcome: string;
  conflict_response_code: string;
}

export interface ActivityAnalysis {
  activity: string;
  peoples: Person[];
  self_emotions: EmotionInteraction;
  state_emotions: EmotionInteraction;
  problem: ProblemAnalysis[];
  strength: string;

}

export interface Reflection {
  achievements: string[];
  shortcomings: string[];
  tomorrow_mindset: string;
  todo: string[];
}

export interface DiaryAnalysis {
  activity_analysis: ActivityAnalysis[];
  reflection: Reflection;
}
