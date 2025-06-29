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
  relationship_type: string;
  interactions: EmotionInteraction;
  social_similarity: SocialSimilarity;
}

export interface ProblemAnalysis {
  problem: string;
  cause: string;
  approach: string;
  outcome: string;
  strength: string;
  weakness: string;
}

export interface ActivityAnalysis {
  activity: string;
  duration: string;
  problem: ProblemAnalysis;
  peoples: Person[];
}

export interface Reflection {
  achievements: string;
  shortcomings: string;
  tomorrow_mindset: string;
  todo: string[];
}

export interface DiaryAnalysis {
  activity_analysis: ActivityAnalysis[];
  reflection: Reflection;
}
