export const PROMPT_VALIDATE = `
  You are the JSON validator.

TASK  
A. FIND every rule violation 아래 기준 확인  
B. FIX directly inside the JSON  
C. RETURN **ONLY** the corrected JSON (no commentary)

================  CHECK LIST  ================

1) CATEGORY
• People  
  - unclear 묘사(“모자 쓴 분”) 삭제  
  - remove 호칭·애칭(“민수형”→“민수”, “도영이”→“도영”)  
• Emotions  
  - Relation ⇢ peoples.interactions.emotion (enum R)  
  - Self ⇢ self_emotions.emotion (enum S)  
  - State ⇢ state_emotions.emotion (enum T)  
  - 배열·강도 길이 반드시 일치  
  - enum 밖 단어 → 가장 근접 enum, 없으면 "None"  
• Strength  
  - 아래 24 개 enum 외 금지, 근거 부족 시 "None"  
• conflict_response_code  
  - 아래 24 개 enum 외 금지, 근거 부족 시 "None"  
  
[ Relation ]  
감사, 존경, 신뢰, 애정, 친밀, 유대, 사랑, 공감, 질투, 시기, 분노, 짜증, 실망, 억울, 속상, 상처, 배신감, 경멸, 거부감, 불쾌

[ Self ]  
자긍심, 자신감, 뿌듯함, 성취감, 만족감, 부끄러움, 수치, 죄책감, 후회, 뉘우침, 창피, 굴욕

[ State ]  
행복, 기쁨, 즐거움, 설렘, 평온, 편안, 안정, 차분, 기대, 긴장, 불안, 초조, 부담, 피로, 지침, 무기력, 지루, 공허, 외로움, 우울, 슬픔, 놀람, 흥분, 활력 

[ STRENGTH (24) ]  
창의성, 호기심, 판단력, 학습애, 통찰력, 용감함, 끈기, 정직함, 활력, 사랑, 친절함, 사회적지능, 팀워크, 공정함, 리더십, 용서, 겸손, 신중함, 자기조절, 미적감상, 감사, 희망, 유머, None 

[ conflict_response_code ]
회피형, 경쟁형, 타협형, 수용형, 협력형

2) PROBLEM LOGIC  
• situation="None" → cause·approach·outcome 모두 "None"  
• approach="None"  → outcome="None"  

3) TEXT FORMAT  
activity는 명사구로 끝나서는 안되고 동사로 끝나도록 명확한 문장 또는 구문으로 변환해야함
For situation / cause / approach / outcome / achievements / shortcomings / todo:  
 - All *_text fields* = "**띄어쓰기 포함** 14자 이하 한국어 명사구". (예: "기술 미흡", "추가 논의", "운동 완료")
 - no “다” endings, no conjunctions(및·그리고·하지만…)  

4) STRUCTURE  
• 모든 emotion_intensity 배열 길이 == 감정 배열 길이  
• 빈 relation/self/state 배열은 [] 유지(필드 삭제 X)  


5) PERSON & MIN-EMOTION CHECK
    • For each activity object:

      ①  Delete every person p in peoples if
          p.name == "None" OR p.name.trim() == "".

      ②  Delete every person p whose
          p.interactions.relation_emotion == [].

      ③  After the deletions, if
          peoples == []           
          AND state_emotions.emotion == []
          ⇒ set
              state_emotions.emotion       = ["무난"];
              state_emotions.emotion_intensity = [4];
              
                


SELF-CHECK (수정 완료 후)  
 ✔ enum match  
 ✔ 길이·텍스트 규칙 준수  
 ✔ problem 논리 규칙 준수  

  `;

export const PROMPT_ANALYZE = `
 {
  "activity_analysis": [
    {
      "activity": "",
      "peoples": [{
        "name": "",
        "interactions": {
          "emotion": [],
          "emotion_intensity": []
        },
        "name_intimacy": ""
      }],
      "self_emotions": {
        "emotion": [],
        "emotion_intensity": []
      },
      "state_emotions": {
        "emotion": [],
        "emotion_intensity": []
      },
      "problem": [{
        "situation": "",
        "approach": "",
        "outcome": "",
        "conflict_response_code":""
      }],
      "strength": ""
    }
  ],
  "reflection": {
    "achievements": [],
    "shortcomings": [],
    "todo": []
  }
}

You are a diary-analysis expert.  
RETURN **ONLY valid JSON** that fits the schema above.

==============  GLOBAL RULES  ==============
• Analyse ONLY from writer's view, no speculation ➜ if unclear → "None".  
• All *_text fields* = "Korean noun phrases of 14 characters or less including spaces". (예: "기술 미흡", "추가 논의", "운동 완료")
• Self-check before output: enum match, array length sync.

==============  1. ACTIVITY  ==============
Definition = Actions performed by the author (including intentions and plans).
Extract ALL regardless of importance.  
예: 일하다·회의하다·수영·요리·대화 등.
Without specific actions, activity_analysis = []

==============  2. PROBLEM  ==============
Problem must occur DURING the activity.  
Fields  
  • situation  = 부정 맥락 핵심어(어려움, 갈등, 실패, …)  
  • approach   = 해결 행동
  • outcome    = 현재 상태/결과  
  • decision_code    = CHOOSE ONE FROM enum [합리적, 직관적, 의존적, 회피적, 충동적]
  • conflict_response_code    =   CHOOSE ONE FROM enum [회피형, 경쟁형, 타협형, 수용형, 협력형형]
↳ situation="None" ⇒ 나머지 4필드도 "None".  
↳ approach="None"  ⇒ outcome="None".

==============  3. EMOTIONS  ==============
Relation(22) ↔ 특정 인물, Self(10) ↔ 자기평가, State(28) ↔ 대상 없음.  
NEVER use words outside each list.
If emotions that are not in the category are inferred, write them as emotions that are most similar to the category. example, "그리움"->"애정"

[ Relation ]  
감사, 존경, 신뢰, 애정, 친밀, 유대, 사랑, 공감, 질투, 시기, 분노, 짜증, 실망, 억울, 속상, 상처, 배신감, 경멸, 거부감, 불쾌

[ Self ]  
자긍심, 자신감, 뿌듯함, 성취감, 만족감, 부끄러움, 수치, 죄책감, 후회, 뉘우침, 창피, 굴욕

[ State ]  
행복, 기쁨, 즐거움, 설렘, 평온, 편안, 안정, 차분, 기대, 긴장, 불안, 초조, 부담, 피로, 지침, 무기력, 지루, 공허, 외로움, 우울, 슬픔, 놀람, 흥분, 활력 

Intensity = base 4 → +2 (“너무 / 정말 / 매우”)  
               - 2 (“조금 / 약간 / 살짝”)  
               +2 신체반응(“심장이 뛰었다” 등)  
               +1 지속표현(“계속”, “오랫동안”)  
CAP 1 - 9.
IF no modifier FOUND → intensity 4.  
MUST cite the exact modifier word in an internal note, then erase the note before final JSON.
example:
“조금 서운했다”     →  emotion_intensity 2
“너무 너무 화가 났다” →  8
“긴장했다” (수정어 없음) → 4

== MIN-EMOTION RULE ==
• 각 activity는 반드시
  - peoples.interactions.relation_emotion OR
  - state_emotions.state_emotion
  둘 중 하나 이상에 최소 1개 감정을 기록해야 한다.
• relation_emotion이 비어 있으면 해당 person 객체 삭제.

==============  4. STRENGTH  ==============
Choose ONE per activity from 24 enum, else "None".  
창의성 호기심 판단력 학습애 통찰력 용감함 끈기 정직함 활력 사랑 친절함 사회적지능 팀워크 공정함 리더십 용서 겸손 신중함 자기조절 미적감상 감사 희망 유머 None  

==============  5. PEOPLE  ==============
  • Include only directly mentioned persons.
  • unclear 묘사(“모자 쓴 분”) 삭제  
  • remove 호칭·애칭(“민수형”→“민수”, “도영이”→“도영”)    
  • Remove person p if
        p.name matches /(친구|팀원|동료|코치)$/ AND p.interactions.relation_emotion == [].
  • 정확한 호칭이 나타나지 않는 대상에 대해서는 "익명의 누군가"를 반환하라

  • For every person p:
      - Keep only RELATION_EMOTION in p.interactions.relation_emotion
      - Move SELF_EMOTION → activity.self_emotions
      - Move STATE_EMOTION → activity.state_emotions

  • For activity.self_emotions:
      - Keep only SELF_EMOTION enum, else map or drop.

  • For activity.state_emotions:
      - Keep only STATE_EMOTION enum, else map or drop.

  • After moves, if peoples == [] AND state_emotions.state_emotion == []:
      ⇒ state_emotions.state_emotion = ["무난"]; s_emotion_intensity = [4]

  • name_intimacy: 애칭1.0/친근0.9/이름0.5/성+직함0.4/거리0.2.

============== CASE : NO ACTIVITY  ==============
**If there is no specific action at all:**:
- activity_analysis = []
- All emotions and thoughts move to reflection
- Record internal conflicts/concerns in shortcomings
- Record action plans in todo
`;

export const PROMPT_ROUTINE = `
당신은 일기를 분석하여 사용자가 우울, 분노, 또는 긴장을 어떤 행동을 통해 해소했는지 찾아내는 어시스턴트이다.

  A. 감정 조건
    - 단순한 감정 표현(예: 울기, 짜증내기, 불안 느끼기)는 해소가 아니다.
    - 감정이 해소되었는지 반드시 **그 결과가 글에 직접 묘사되어야 하며**, 해소되지 않은 감정 상태는 절대 출력하지 말 것.
    - 긴장은 신체적인 긴장이 아니라 감정적 긴장만 포함한다.
    
  B. 행동 조건
   - 감정 해소와 관련된 **주체적이고 의도적인 행동**만 추출하라.
    - 단순히 감정을 느낀 것, 타인에게 영향을 받은 것(예: 친구가 위로함)은 모두 제외하고 "None"으로 출력하라.
    - 행동은 **사물, 장소, 감정 표현**이 아니라 **감정을 완화한 심리적 기능 중심**으로 요약하라.
    - 예를 들어 ‘생각을 멈추기 위해 강한 소음 속에 있었음’ → “소음으로 감각 차단하기”

    C. 출력 조건
    - 각 감정을 해소한 직접적이고 주체적인 행동이 없는 경우, 절대 추측하지 말고 반드시 "None"으로 출력하라.
    - 출력은 JSON 형식이며, 각 값은 **20자 이하의 한국어 명사구**로 하되, **"~하기"/"~기" 형식**으로 작성하라.

  다음 형식을 지켜라. json 외 다른 설명은 하지 말고 출력하라.

  {
  "depression": "",
  "anger": "",
  "nervous": ""
  }
`;

export function promptRAG(
  question: string,
  documents: {
    diary_id: number;
    memberId: string;
    sentence: string;
    date: string;
  }[],
  today: string,
) {
  const formattedDocs = JSON.stringify(documents, null, 2);

  return `
사용자의 질의는 다음과 같습니다:

질문: "${question}"

오늘 날짜는 ${today}입니다.
사용자의 질문에 "최근", "3개월 이내", "작년", "저번달", "2주전" 등 기간을 포함하는 표현이 있다면, 반드시 문장의 날짜(date 필드)를 보고 비교해서 판단해 주세요.

아래는 과거에 사용자가 작성한 일기 문장들입니다.
각 문장에는 다음 필드가 포함되어 있습니다:
- diary_id: 해당 문장이 포함된 일기의 고유 ID
- sentence: 일기 문장 내용
- date: 문장이 작성된 날짜 (YYYY-MM-DD 형식)
또한, 문장에는 다음과 같이 전처리를 위한 태그가 붙어있을 수 있습니다.
예시 : [tag] sentence

위 질문에 대한 검색으로 다음 문장 목록들이 유효한지 검사해주세요. 태그가 일치하다면 큰 가점을 주면 좋습니다.
유효하다면 true, 아니라면 false, 결과를 JSON 배열 형식으로 반환해 주세요.
json 외의 다른 설명은 하지 말고 출력하세요

문장 목록:
${formattedDocs}

응답 형식 (주의: JSON 배열만 반환하세요):

[
  {
    "diary_id": 76,
    "sentence" : "이러한 일이 있었다"
    "is_similar": true
  },
  {
    "diary_id": 92,
    "sentence" : "저러한 일이 있었다"
    "is_similar": true
  },
  {
    "diary_id": 84,
    "sentence" : "그러한 일이 있었다"
    "is_similar": false
  }
]
  `;
}

export function taggingPrompt(content: string) {
  return `
다음은 사용자가 하루 동안 작성한 일기입니다. 전체 일기를 먼저 읽고 문맥을 이해한 다음, 문장을 분리하고 각 문장에 어울리는 주제 태그를 붙여주세요.

💡 이 태깅 결과는 나중에 각 문장을 벡터 임베딩하여 자연어 검색할 때 유사한 문장을 더 잘 찾기 위한 용도로 사용됩니다.  
즉, 사용자가 "여행 간 날", "기뻤던 날", "스트레스 받았던 날" 등의 질문을 했을 때 정확한 문장이 검색될 수 있도록, 각 문장의 의미와 주제를 잘 반영하는 태그를 지정해주세요.

일기:
"""
${content}
"""

기본적으로 다음과 같은 주제 태그를 사용할 수 있습니다:

["기쁨", "슬픔", "스트레스", "건강", "가족", "공부", "학교", "일", "여행", "취미" ]

- 위 목록에 없는 태그도 상황에 따라 자유롭게 추가할 수 있습니다. (예: "운전", "시험", "퇴사", "병원", "결혼식" 등)
- 특정 장소가 나타나거나, 인물이 나타났다면 관련 태그를 붙여붙세요. (예: "일본", "파리", "민수", "영희")
- 태그가 없는 문장은 빈 리스트([])를 사용해주세요.
- 출력은 다음과 같은 형식으로 해주세요 (태그는 대괄호 안에 쉼표로 구분하고, 문장과는 공백 한 칸으로 구분합니다):
- **이외의 다른 응답은 절대 하지 마세요.**

[태그1, 태그2] 문장 내용

- 문장은 원문의 순서를 그대로 유지해주세요.
- 태그는 의미 있는 순서로 정렬해주세요 (예: 상위 개념 먼저).

---

예시:

입력:
"""
오랜만에 속초 바다를 보니 기분이 정말 좋았다. 엄마랑 아빠가 함께여서 더 의미 있었던 하루였다. 집에 돌아와서는 피곤해서 일찍 잠들었다.
"""

출력:
[여행, 감정] 오랜만에 속초 바다를 보니 기분이 정말 좋았다.  
[가족, 감사] 엄마랑 아빠가 함께여서 더 의미 있었던 하루였다.  
[피로] 집에 돌아와서는 피곤해서 일찍 잠들었다.
  `;
}



