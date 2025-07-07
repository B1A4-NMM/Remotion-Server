export type RelationLabel = '연결' | '거리';
export type StateLabel = '고양' | '긴장' | '평온' | '무기력';
export type SelfLabel = '긍정' | '부정';

export type CharacterKey = `${RelationLabel}-${StateLabel}-${SelfLabel}`;

// 캐릭터 이름 매핑 => 이 데이터를 클라이언트에 보내줌 

export const CharacterAnimalMap: Record<string, string> = {
    '연결-고양-긍정': '호랑이',
    '연결-고양-부정': '작은 새',
    '연결-긴장-긍정': '강아지',
    '연결-긴장-부정': '고양이',
    '연결-평온-긍정': '팬더',
    '연결-평온-부정': '펭귄',
    '연결-무기력-긍정': '나무늘보',
    '연결-무기력-부정': '다람쥐',
    '거리-고양-긍정': '독수리',
    '거리-고양-부정': '코브라',
    '거리-긴장-긍정': '여우',
    '거리-긴장-부정': '박쥐',
    '거리-평온-긍정': '고래',
    '거리-평온-부정': '거북이',
    '거리-무기력-긍정': '개구리',
    '거리-무기력-부정': '문어',
  };
  
