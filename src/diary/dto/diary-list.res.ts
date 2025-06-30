import { EmotionType } from '../../enums/emotion-type.enum';

export class DiaryRes {
  diaryId:number
  title:string
  writtenDate:Date
  emotions:EmotionType[] = []
  targets:string[] = []
}

export class DiaryListRes{
  diaries:DiaryRes[] = []
}