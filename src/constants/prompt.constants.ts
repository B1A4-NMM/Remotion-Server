export const PROMPT_VALIDATE =
  `
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
  - Relation ⇢ peoples.interactions.relation_emotion (enum R)  
  - Self ⇢ self_emotions.self_emotion (enum S)  
  - State ⇢ state_emotions.state_emotion (enum T)  
  - 배열·강도 길이 반드시 일치  
  - enum 밖 단어 → 가장 근접 enum, 없으면 "None"  
• Strength  
  - 아래 24 개 enum 외 금지, 근거 부족 시 "None"  

[ Relation ]  
감사, 존경, 신뢰, 애정, 친밀, 유대, 사랑, 공감, 시기, 질투, 분노, 실망, 짜증, 화남, 억울, 속상, 상처, 배신감, 경멸, 거부감, 무시, 불쾌  

[ Self ]  
부끄러움, 수치, 미안함, 죄책감, 후회, 뉘우침, 창피, 당혹, 굴욕, 자신감, 자긍심, 뿌듯함, 성취감, 만족감

[ State ]  
행복, 기쁨, 즐거움, 설렘, 평온, 편안, 안정, 무난, 차분, 기대, 긴장, 불안, 초조, 부담, 피로, 지침, 무기력, 지루, 공허, 외로움, 우울, 슬픔, 놀람, 당황, 흥분, 졸림, 활력, 신남  

[ STRENGTH (24) ]  
창의성, 호기심, 판단력, 학습애, 통찰력, 용감함, 끈기, 정직함, 활력, 사랑, 친절함, 사회적지능, 팀워크, 공정함, 리더십, 용서, 겸손, 신중함, 자기조절, 미적감상, 감사, 희망, 유머, None  

2) PROBLEM LOGIC  
• situation="None" → cause·approach·outcome 모두 "None"  
• approach="None"  → outcome="None"  

3) TEXT FORMAT  
For activity / situation / cause / approach / outcome / achievements / shortcomings / todo:  
 - All *_text fields* = "**띄어쓰기 포함** 14자 이하 한국어 명사구". (예: "기술 미흡", "추가 논의", "운동 완료")
 - no “다” endings, no conjunctions(및·그리고·하지만…)  

4) STRUCTURE  
• 모든 *_intensity 배열 길이 == 감정 배열 길이  
• 빈 relation/self/state 배열은 [] 유지(필드 삭제 X)  


5) PERSON & MIN-EMOTION CHECK
    • For each activity object:

      ①  Delete every person p in peoples if
          p.name == "None" OR p.name.trim() == "".

      ②  Delete every person p whose
          p.interactions.relation_emotion == [].

      ③  After the deletions, if
          peoples == []           
          AND state_emotions.state_emotion == []
          ⇒ set
              state_emotions.state_emotion       = ["무난"];
              state_emotions.s_emotion_intensity = [4];


SELF-CHECK (수정 완료 후)  
 ✔ enum match  
 ✔ 길이·텍스트 규칙 준수  
 ✔ problem 논리 규칙 준수  

  `

export const PROMPT_ANALYZE =`
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
        "cause": "",
        "approach": "",
        "outcome": ""
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
• All *_text fields* = "**띄어쓰기 포함** 14자 이하 한국어 명사구". (예: "기술 미흡", "추가 논의", "운동 완료")
• Self-check before output: enum match, array length sync.

==============  1. ACTIVITY  ==============
Definition = 작성자가 실재로 수행한 행위(의도·계획 제외).  
Extract ALL regardless of importance.  
예: 일하다·회의하다·수영·요리·대화 등.

==============  2. PROBLEM  ==============
Problem must occur DURING the activity.  
Fields  
  • situation  = 부정 맥락 핵심어(어려움, 갈등, 실패, …)  
  • cause      = 원인 행동·조건(선행)  
  • approach   = 해결 행동(후행)  
  • outcome    = 현재 상태/결과  
↳ situation="None" ⇒ 나머지 3필드도 "None".  
↳ approach="None"  ⇒ outcome="None".

==============  3. EMOTIONS  ==============
Relation(22) ↔ 특정 인물, Self(10) ↔ 자기평가, State(28) ↔ 대상 없음.  
NEVER use words outside each list.

[ Relation ]  
감사, 존경, 신뢰, 애정, 친밀, 유대, 사랑, 공감, 시기, 질투, 분노, 실망, 짜증, 화남, 억울, 속상, 상처, 배신감, 경멸, 거부감, 무시, 불쾌  

[ Self ]  
부끄러움, 수치, 미안함, 죄책감, 후회, 뉘우침, 창피, 당혹, 굴욕, 자신감, 자긍심, 뿌듯함, 성취감, 만족감

[ State ]  
행복, 기쁨, 즐거움, 설렘, 평온, 편안, 안정, 무난, 차분, 기대, 긴장, 불안, 초조, 부담, 피로, 지침, 무기력, 지루, 공허, 외로움, 우울, 슬픔, 놀람, 당황, 흥분, 졸림, 활력, 신남  

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
• diary 본문에서 해당 활동에 감정 표현이 전혀 없으면
  state_emotions.state_emotion := ["무난"];  intensity := [4].
• relation_emotion이 비어 있으면 해당 person 객체 삭제.

==============  4. STRENGTH  ==============
Choose ONE per activity from 24 enum, else "None".  
창의성 호기심 판단력 학습애 통찰력 용감함 끈기 정직함 활력 사랑 친절함 사회적지능 팀워크 공정함 리더십 용서 겸손 신중함 자기조절 미적감상 감사 희망 유머 None  

==============  5. PEOPLE  ==============
  • Include only directly mentioned persons.  
  • Remove person p if
        p.name matches /(친구|팀원|동료|코치)$/ AND p.interactions.relation_emotion == [].

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
`
