export enum StrengthType {

  창의성 = '창의성',
  호기심 = '호기심',
  판단력 = '판단력',
  학습애 = '학습애',
  통찰력 = '통찰력',

  용감함 = '용감함',
  끈기 = '끈기',
  정직함 = '정직함',
  활력 = '활력',

  사랑 = '사랑',
  친절함 = '친절함',
  사회적지능 = '사회적지능',

  팀워크 = '팀워크',
  공정함 = '공정함',
  리더십 = '리더십',

  용서 = '용서',
  겸손 = '겸손',
  신중함 = '신중함',
  자기조절 = '자기조절',
  미적감상 = '미적감상',
  감사 = '감사',
  희망 = '희망',
  유머 = '유머',
  영성 = '영성',

}

export enum StrengthCategory{
  지혜 = '지혜',
  용기 = '용기',
  인애 = '인애',
  정의 = '정의',
  절제 = '절제',
  초월 = '초월',  
}


export const strengthCategoryMap: Record<StrengthType, StrengthCategory> ={

  창의성: StrengthCategory.지혜,
  호기심: StrengthCategory.지혜,
  판단력: StrengthCategory.지혜,
  학습애: StrengthCategory.지혜,
  통찰력: StrengthCategory.지혜,

  용감함: StrengthCategory.용기,
  끈기: StrengthCategory.용기,
  정직함: StrengthCategory.용기,
  활력: StrengthCategory.용기,

  사랑: StrengthCategory.인애,
  친절함: StrengthCategory.인애,
  사회적지능: StrengthCategory.인애,

  팀워크: StrengthCategory.정의,
  공정함: StrengthCategory.정의,
  리더십: StrengthCategory.정의,

  용서: StrengthCategory.절제,
  겸손: StrengthCategory.절제,
  신중함: StrengthCategory.절제,
  자기조절: StrengthCategory.절제,

  미적감상: StrengthCategory.초월,
  감사: StrengthCategory.초월,
  희망: StrengthCategory.초월,
  유머: StrengthCategory.초월,
  영성: StrengthCategory.초월,


}