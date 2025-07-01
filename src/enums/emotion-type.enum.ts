export enum EmotionType {
  행복 = '행복',
  기쁨 = '기쁨',
  신남 = '신남',
  설렘 = '설렘',
  유대 = '유대',
  신뢰 = '신뢰',
  존경 = '존경',
  친밀 = '친밀',
  자신감 = '자신감',
  서운 = '서운',
  평온 = '평온',
  안정 = '안정',
  편안 = '편안',
  시기 = '시기',
  소외 = '소외',
  불안 = '불안',
  실망 = '실망',
  기대 = '기대',
  속상 = '속상',
  상처 = '상처',
  감사 = '감사',
  무난 = '무난',
  차분 = '차분',
  긴장 = '긴장',
  화남 = '화남',
  짜증 = '짜증',
  무기력 = '무기력',
  지침 = '지침',
  지루 = '지루',
  억울 = '억울',
  외로움 = '외로움',
  우울 = '우울',
  공허 = '공허',
  초조 = '초조',
  부담 = '부담',
  어색 = '어색',
  불편 = '불편',
  단절 = '단절',
}

export enum EmotionGroup {
  활력 = '활력',
  안정 = '안정',
  유대 = '유대',
  스트레스 = '스트레스',
  불안 = '불안',
  우울 = '우울',
}

const EmotionGroupMap: Record<EmotionType, EmotionGroup | null> = {
  // 활력
  행복: EmotionGroup.활력,
  기쁨: EmotionGroup.활력,
  신남: EmotionGroup.활력,
  설렘: EmotionGroup.활력,
  자신감: EmotionGroup.활력,
  기대: EmotionGroup.활력,

  // 안정
  평온: EmotionGroup.안정,
  안정: EmotionGroup.안정,
  편안: EmotionGroup.안정,
  무난: EmotionGroup.안정,
  차분: EmotionGroup.안정,

  // 유대
  유대: EmotionGroup.유대,
  신뢰: EmotionGroup.유대,
  존경: EmotionGroup.유대,
  친밀: EmotionGroup.유대,
  감사: EmotionGroup.유대,

  // 스트레스
  화남: EmotionGroup.스트레스,
  짜증: EmotionGroup.스트레스,
  억울: EmotionGroup.스트레스,
  부담: EmotionGroup.스트레스,
  긴장: EmotionGroup.스트레스,
  어색: EmotionGroup.스트레스,
  불편: EmotionGroup.스트레스,
  지침: EmotionGroup.스트레스,

  // 불안
  불안: EmotionGroup.불안,
  초조: EmotionGroup.불안,
  실망: EmotionGroup.불안,
  소외: EmotionGroup.불안,
  시기: EmotionGroup.불안,
  단절: EmotionGroup.불안,

  // 우울
  우울: EmotionGroup.우울,
  공허: EmotionGroup.우울,
  외로움: EmotionGroup.우울,
  무기력: EmotionGroup.우울,
  속상: EmotionGroup.우울,
  상처: EmotionGroup.우울,
  서운: EmotionGroup.우울,
  지루: EmotionGroup.우울,
};

// 치환 함수
export function getEmotionGroup(emotion: EmotionType): EmotionGroup {
  return EmotionGroupMap[emotion] ?? EmotionGroup.활력;
}

export function isEmotionType(value: string): value is EmotionType {
  return (Object.values(EmotionType) as string[]).includes(value);
}

