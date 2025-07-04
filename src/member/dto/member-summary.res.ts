import { EmotionBase, EmotionGroup } from '../../enums/emotion-type.enum';

interface EmotionGroups {
  emotion: EmotionGroup;
  intensity: number;
}

interface PerDate {
  date: Date;
  emotions: EmotionGroups[];
}

export class MemberSummaryRes {
  //우울 경고
  depressionWarning: boolean;
  //스트레스 경고
  stressWarning: boolean;
  //불안 경고
  anxietyWarning: boolean;

  emotionsPerDate: PerDate[] = []
  period: number
}
