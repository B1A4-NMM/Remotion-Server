import { EmotionGroup, EmotionType } from '../../enums/emotion-type.enum';

interface Emotion{
  type: EmotionType;
  score: number;
}

export class DiaryEmotionGroupingDto {
  emotions : Emotion[];

  constructor(emotions: {type: EmotionType, score: number}[]) {
    this.emotions = emotions;
  }
}

