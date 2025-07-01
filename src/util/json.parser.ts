export interface EmotionInteraction {
  emotion: string[];
  emotion_intensity: number[];
}

export interface SocialSimilarity {
  name_intimacy: number;
  shared_activity: number;
  information_sharing: number;
  emotional_expression: number;
}

export interface Person {
  name: string;
  interactions: EmotionInteraction;
  name_similarity: number;
}

export interface ProblemAnalysis {
  situation: string;
  cause: string;
  approach: string;
  outcome: string;
}

export interface ActivityAnalysis {
  activity: string;
  problem: ProblemAnalysis[];
  strength: string;
  weakness: string;
  peoples: Person[];
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
