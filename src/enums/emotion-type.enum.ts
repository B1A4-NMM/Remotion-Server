export enum EmotionBase {
  Relation = 'Relation',
  Self = 'Self',
  State = 'State',
}

export enum EmotionType {
  무난 = '무난',

  // [Relation] 관계 기반 감정
  감사 = '감사',
  존경 = '존경',
  신뢰 = '신뢰',
  애정 = '애정',
  친밀 = '친밀',
  유대 = '유대',
  사랑 = '사랑',
  공감 = '공감',
  질투 = '질투',
  시기 = '시기',
  분노 = '분노',
  짜증 = '짜증',
  실망 = '실망',
  억울 = '억울',
  속상 = '속상',
  상처 = '상처',
  배신감 = '배신감',
  경멸 = '경멸',
  거부감 = '거부감',
  불쾌 = '불쾌',

  // [Self] 자기 자신에 대한 감정
  자긍심 = '자긍심',
  자신감 = '자신감',
  뿌듯함 = '뿌듯함',
  성취감 = '성취감',
  만족감 = '만족감',
  부끄러움 = '부끄러움',
  수치 = '수치',
  죄책감 = '죄책감',
  후회 = '후회',
  뉘우침 = '뉘우침',
  창피 = '창피',
  굴욕 = '굴욕',

  // [State] 상태성 감정
  행복 = '행복',
  기쁨 = '기쁨',
  즐거움 = '즐거움',
  설렘 = '설렘',
  평온 = '평온',
  편안 = '편안',
  안정 = '안정',
  차분 = '차분',
  기대 = '기대',
  긴장 = '긴장',
  불안 = '불안',
  초조 = '초조',
  부담 = '부담',
  피로 = '피로',
  지침 = '지침',
  무기력 = '무기력',
  지루 = '지루',
  공허 = '공허',
  외로움 = '외로움',
  우울 = '우울',
  슬픔 = '슬픔',
  놀람 = '놀람',
  흥분 = '흥분',
  활력 = '활력',
}

export enum EmotionGroup {
  활력 = '활력',
  안정 = '안정',
  유대 = '유대',
  스트레스 = '스트레스',
  불안 = '불안',
  우울 = '우울',
}

export const EmotionGroupMap: Record<EmotionType, EmotionGroup | null> = {
  // 활력
  행복: EmotionGroup.활력,
  기쁨: EmotionGroup.활력,
  즐거움: EmotionGroup.활력,
  설렘: EmotionGroup.활력,
  활력: EmotionGroup.활력,
  자신감: EmotionGroup.활력,
  자긍심: EmotionGroup.활력,
  뿌듯함: EmotionGroup.활력,
  성취감: EmotionGroup.활력,
  만족감: EmotionGroup.활력,
  기대: EmotionGroup.활력,
  흥분: EmotionGroup.활력,

  // 안정
  평온: EmotionGroup.안정,
  편안: EmotionGroup.안정,
  안정: EmotionGroup.안정,
  차분: EmotionGroup.안정,
  무난: EmotionGroup.안정,

  // 유대
  유대: EmotionGroup.유대,
  신뢰: EmotionGroup.유대,
  존경: EmotionGroup.유대,
  친밀: EmotionGroup.유대,
  애정: EmotionGroup.유대,
  사랑: EmotionGroup.유대,
  공감: EmotionGroup.유대,
  감사: EmotionGroup.유대,

  // 스트레스
  긴장: EmotionGroup.스트레스,
  부담: EmotionGroup.스트레스,
  피로: EmotionGroup.스트레스,
  지침: EmotionGroup.스트레스,
  놀람: EmotionGroup.스트레스,

  // 불안
  불안: EmotionGroup.불안,
  초조: EmotionGroup.불안,
  질투: EmotionGroup.불안,
  시기: EmotionGroup.불안,
  실망: EmotionGroup.불안,
  배신감: EmotionGroup.불안,
  부끄러움: EmotionGroup.불안,
  수치: EmotionGroup.불안,
  창피: EmotionGroup.불안,

  // 우울
  우울: EmotionGroup.우울,
  공허: EmotionGroup.우울,
  외로움: EmotionGroup.우울,
  무기력: EmotionGroup.우울,
  지루: EmotionGroup.우울,
  속상: EmotionGroup.우울,
  상처: EmotionGroup.우울,
  억울: EmotionGroup.우울,
  후회: EmotionGroup.우울,
  뉘우침: EmotionGroup.우울,
  죄책감: EmotionGroup.우울,
  굴욕: EmotionGroup.우울,
  분노: EmotionGroup.우울,
  짜증: EmotionGroup.우울,
  경멸: EmotionGroup.우울,
  거부감: EmotionGroup.우울,
  불쾌: EmotionGroup.우울,
  슬픔: EmotionGroup.우울
};

export const RelationEmotions: EmotionType[] = [
  EmotionType.감사,
  EmotionType.존경,
  EmotionType.신뢰,
  EmotionType.애정,
  EmotionType.친밀,
  EmotionType.유대,
  EmotionType.사랑,
  EmotionType.공감,
  EmotionType.질투,
  EmotionType.시기,
  EmotionType.분노,
  EmotionType.짜증,
  EmotionType.실망,
  EmotionType.억울,
  EmotionType.속상,
  EmotionType.상처,
  EmotionType.배신감,
  EmotionType.경멸,
  EmotionType.거부감,
  EmotionType.불쾌,
];

export const SelfEmotions: EmotionType[] = [
  EmotionType.자긍심,
  EmotionType.자신감,
  EmotionType.뿌듯함,
  EmotionType.성취감,
  EmotionType.만족감,
  EmotionType.부끄러움,
  EmotionType.수치,
  EmotionType.죄책감,
  EmotionType.후회,
  EmotionType.뉘우침,
  EmotionType.창피,
  EmotionType.굴욕,
];

export const StateEmotions: EmotionType[] = [
  EmotionType.행복,
  EmotionType.기쁨,
  EmotionType.즐거움,
  EmotionType.설렘,
  EmotionType.평온,
  EmotionType.편안,
  EmotionType.안정,
  EmotionType.차분,
  EmotionType.기대,
  EmotionType.긴장,
  EmotionType.불안,
  EmotionType.초조,
  EmotionType.부담,
  EmotionType.피로,
  EmotionType.지침,
  EmotionType.무기력,
  EmotionType.지루,
  EmotionType.공허,
  EmotionType.외로움,
  EmotionType.우울,
  EmotionType.슬픔,
  EmotionType.놀람,
  EmotionType.흥분,
  EmotionType.활력,
];

// 치환 함수
export function getEmotionGroup(emotion: EmotionType): EmotionGroup {
  return EmotionGroupMap[emotion] ?? EmotionGroup.활력;
}

export function isEmotionType(value: string): value is EmotionType {
  return (Object.values(EmotionType) as string[]).includes(value);
}
