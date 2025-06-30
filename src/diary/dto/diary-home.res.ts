import { EmotionType } from '../../enums/emotion-type.enum';
import { DiaryRes } from './diary-list.res';

export class EmotionRes {
  emotionType:EmotionType
  intensity:number
}

export class DiaryHomeRes {
  todayEmotions:EmotionRes[] = []
  todayDiaries:DiaryRes[] = []
}