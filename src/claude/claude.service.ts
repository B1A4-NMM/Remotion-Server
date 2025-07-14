import { Injectable } from '@nestjs/common';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';
import { DiaryAnalysis } from '../util/json.parser';
import { PROMPT_ANALYZE, PROMPT_ROUTINE, PROMPT_VALIDATE, promptRAG } from '../constants/prompt.constants';
import { EmotionLevels } from '../util/routine.parser';
import { EmotionGroup } from '../enums/emotion-type.enum';
import { LocalDate } from 'js-joda';

@Injectable()
export class ClaudeService {
  private readonly client: BedrockRuntimeClient;

  constructor(private readonly configService: ConfigService) {
    // @ts-ignore
    this.client = new BedrockRuntimeClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  private readonly promptRules = {
    rules: '다음 규칙을 준수하여 답변을 해줘.',
    rule1:
      '1. 일기에서 나오는 인물이나 장소 + 내가 그 인물이나 장소에 느끼거나 받은 감정을 추출한다. 인물이나 장소 이외의 다른 것은 절대 추출하지 말 것',
    rule2: '2. 답변 예시는 {"민수":["분노"], "영희":["행복","기쁨]} 식으로',
    rule3:
      '3. json 형식을 그대로 사용할 것이기 때문에 예시 이외의 답변이나 추가 질문은 절대 하지 말 것',
    rule4:
      '4. 나타나는 감정은 다음 25가지 감정 리스트 중 선택해줘, 이외의 감정은 절대 있으면 안되고, 오타가 나서도 안돼: [행복, 기쁨, 신남, 설렘, 기대, 자신감, 분노, 짜증, 불안, 초조, 슬픔, 당황, 지루, 속상, 무기력, 우울, 공허, 외로움, 지침, 평온, 안정, 차분, 편안, 감사, 무난]',
    rule5: '30자 내외로 일기를 요약해줘',
  };

  private preprocessPrompt(prompt: string): string {
    // Add custom preprocessing logic here
    // For example: Add context, formatting, or specific instructions
    return `${this.promptRules.rules} ${this.promptRules.rule1} ${this.promptRules.rule2} ${this.promptRules.rule3} ${this.promptRules.rule4}, 일기: ${prompt}`;
  }

  private summaryPrompt(prompt: string): string {
    return `
     다음 기준을 엄격히 적용하라.
     1. 다음 일기를 읽고, 최대한 한줄로 요약하라.
     2. 일기에서 나타난 중요한 활동을 기준으로 요약하라. 이 때 모든 활동을 사용할 필요는 없고, 가장 두드러지게 나타난 활동 또는 감정을 기준으로 하라.
     3. 가능하면 중요한 활동을 통해 일기에서 나타난 감정을 기준으로 요약하라.
     4. 20자 내외로 요약하라.
     5. "오늘은" 으로 일기처럼 시작하지 말라. 제목으로 사용할만하게 요약하라
     6. 예시는 "카페에서 친구들과 수다를 떨던 여유로운 하루", "피드백을 세게 받아 하루종일 우울한 날", "애인과 싸워서 화가 머리끝까지 난 하루"
     
     일기 : ${prompt}`;
  }

  private patternAnalysisPrompt(prompt: string): string {
    return `
      ${PROMPT_ANALYZE}
      
      일기: ${prompt}`;
  }

  private resultAnalysis(result: string): string {
    return `
        ${PROMPT_VALIDATE}
        
        일기 분석 결과: ${result}
        `;
  }

  private ActionAnalysis(prompt: string): string {
    return `
  ${PROMPT_ROUTINE}

  일기: ${prompt}
`;
  }

  private recommendCommentPrompt(activites:string[], emotion:EmotionGroup, dayOfWeek:string): string {
    return `
    당신은 사용자의 기분 전환을 위한 특정 행동을 추천해주는 멘트를 써줘야한다.
    오늘은 ${dayOfWeek}이고, 사용자는 이 요일마다 ${emotion} 감정을 많이 받는다.
    사용자는 다음 행동들에서 긍정적인 감정을 얻을 가능성이 높다.
    ${activites.join(', ')}
    이를 참고하여 사용자가 자연스럽게 위로를 받을 수 있는 멘트를 써라. 다음은 예시이다.
    1. 월요일마다 우울한 감정이 많이 드시네요!! 러닝을 통해 기분전환 어떠세요?
    2. 화요일마다 스트레스를 많이 받으시네요. 명상을 통해 화를 다스리시는 게 어떠세요? 
    만약 아무 행동도 없다면, 저 감정을 위로할만한 행동 하나를 뽑아 응답하라.
    또한 '**' 와 같은 강조 표시나, 멘트 이외의 다른 잡설은 넣지 마라.
    `
  }

  async querySummary(prompt: string): Promise<string> {
    const processedPrompt = this.summaryPrompt(prompt);

    const command = new InvokeModelCommand({
      modelId: 'apac.amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{ role: 'user', content: [{ text: processedPrompt }] }],
        inferenceConfig: {
          maxTokens: 4000,
          temperature: 0.7,
          topP: 0.9,
        },
      }),
    });

    const response = await this.client.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    return parsed?.output?.message?.content?.[0]?.text || 'No response';
  }

  async queryClaude(prompt: string): Promise<string> {
    const processedPrompt = this.preprocessPrompt(prompt);

    const command = new InvokeModelCommand({
      modelId: 'apac.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        messages: [{ role: 'user', content: processedPrompt }],
        max_tokens: 4000,
      }),
    });

    const response = await this.client.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    return parsed?.content?.[0]?.text || 'No response';
  }

  async serializeAnalysis(prompt: string): Promise<DiaryAnalysis> {
    return this.queryDiaryPatterns(prompt);
  }

  async queryDiaryPatterns(prompt: string) {
    try {

      const processedPrompt = this.patternAnalysisPrompt(prompt);

      const command = new InvokeModelCommand({
        modelId: 'apac.amazon.nova-pro-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: [{ text: processedPrompt }] },
          ],
          inferenceConfig: {
            maxTokens: 4000,
            temperature: 0.05,
            topP: 0.9,
          },
        }),
      });

      const response = await this.client.send(command);
      const body = await response.body.transformToString();
      const parsed = JSON.parse(body);

      let responseText = parsed?.output?.message?.content?.[0]?.text || 'No response';


      if (!responseText) {
        throw new Error('No response text received');
      }


      const checkPrompt = this.resultAnalysis(responseText);
      const checkCommand = new InvokeModelCommand({
        modelId: 'apac.amazon.nova-pro-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: [{ text: checkPrompt }] },
          ],
          inferenceConfig: {
            maxTokens: 4000,
            temperature: 0.05,
            topP: 0.9,
          },
        }),
      });

      const checkedResponse = await this.client.send(checkCommand);
      const checkedBody = await checkedResponse.body.transformToString();
      const checkedParsed = JSON.parse(checkedBody);

      let finalResult = checkedParsed?.output?.message?.content?.[0]?.text || 'No response';


      if (!finalResult) {
        throw new Error('No response text received');
      }


      function cleanJsonResponse(text) {
        // `````` 제거
        let cleaned = text.replace(/``````\s*$/g, '');

        // 앞뒤 공백 제거
        cleaned = cleaned.trim();

        // JSON 시작과 끝 확인
        const startIndex = cleaned.indexOf('{');
        const endIndex = cleaned.lastIndexOf('}');

        if (startIndex !== -1 && endIndex !== -1) {
          return cleaned.substring(startIndex, endIndex + 1);
        }

        return cleaned;
      }


      // 마크다운 형식 제거
      finalResult = cleanJsonResponse(finalResult);

      const emotion_weights = {
        '행복': 1.0,
        '기쁨': 1.0,
        '신남': 1.0,
        '설렘': 0.95,
        '유대': 0.95,
        '신뢰': 0.95,
        '친밀': 0.9,
        '그리움': 0.9,
        '자신감': 0.9,
        '서운': 0.8,
        '평온': 0.8,
        '안정': 0.8,
        '편안': 0.75,
        '소외': 0.65,
        '불안': 0.65,
        '실망': 0.65,
        '기대': 0.6,
        '속상': 0.6,
        '상처': 0.5,
        '감사': 0.5,
        '무난': 0.5,
        '차분': 0.5,
        '긴장': 0.45,
        '화남': 0.4,
        '짜증': 0.4,
        '무기력': 0.35,
        '지침': 0.3,
        '지루': 0.3,
        '억울': 0.3,
        '외로움': 0.25,
        '우울': 0.25,
        '공허': 0.2,
        '초조': 0.2,
        '부담': 0.15,
        '어색': 0.1,
        '불편': 0.05,
        '단절': 0.05,
      };

      // 시간 간격을 숫자로 변환
      const time_mapping = {
        'all': 24,
        'most': 12,
        'some': 6,
        'little': 3,
        'moment': 1,
        'None': 0,
      };

      function getEmotionWeight(emotion) {
        return emotion_weights[emotion] || 0.1; // 직접 접근으로 수정
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(finalResult);
      } catch (error) {
        console.error('JSON parsing failed:', error);
        throw new Error('Invalid JSON response format');
      }

      // 심적 거리 계산 및 결과 추가
      if (parsedResponse?.peoples && Array.isArray(parsedResponse.peoples)) {
        parsedResponse.peoples.forEach((person) => {
          const interactions = person.interactions || {};

          const intensity = interactions.emotion_intensity || 0;
          const main_emotion = interactions.emotion || '';
          const sub_emotions = interactions.sub_emotions || [];
          const mentions = interactions.mentions || 1;
          const duration = interactions.duration || 'None';
          const similarity = person.social_similarity || [];

          const main_emotion_weight = getEmotionWeight(main_emotion);

          let avg_sub_emotion_weight = 0;
          if (sub_emotions && sub_emotions.length > 0) {
            const sub_emotion_weights = sub_emotions.map(getEmotionWeight);
            avg_sub_emotion_weight = sub_emotion_weights.reduce((a, b) => a + b, 0) / sub_emotion_weights.length;
          }

          const final_emotion_weight = main_emotion_weight * 0.7 + avg_sub_emotion_weight * 0.3;
          const duration_value = time_mapping[duration] || 0;
          const social_similarity_score =
            similarity.name_intimacy * 0.3 +
            similarity.shared_activity * 0.2 +
            similarity.information_sharing * 0.2 +
            similarity.emotional_expression * 0.3;

          // 순서대로 감정 강도, 지속시간, 언급 빈도, 지속시간, 친밀도
          const alpha = 1.0, beta = 0.4, gamma = 0.25, delta = 0.2, epsilon = 0.7;

          // 수정된 심적 거리 계산 공식
          const psychological_distance =
            alpha * intensity * (1 - final_emotion_weight) +  // 좋은 감정일수록 거리 감소
            beta * Math.log(duration_value + 1) +
            gamma * (mentions > 0 ? Math.pow(mentions, -1) : 1) +
            delta * duration_value -                           // 지속시간은 거리 증가 요인
            epsilon * social_similarity_score;                 // 친밀도 높을수록 거리 감소

          // 심적 거리는 양수가 되도록 조정
          const final_psychological_distance = Math.max(0.1, psychological_distance);

          // console.log(`=== ${person.name} ===`);
          // console.log(`감정: ${main_emotion} (가중치: ${final_emotion_weight.toFixed(3)})`);
          // console.log(`감정 강도: ${intensity}`);
          // console.log(`언급 횟수: ${mentions}`);
          // console.log(`사회적 유사성: ${social_similarity_score.toFixed(2)}`);
          // console.log(`심적 거리: ${final_psychological_distance.toFixed(3)}`);
          // console.log('---');
        });
      }

      return parsedResponse;

    } catch (error) {
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }

  // 루틴 추출 메서드
  async serializeRoutine(prompt: string): Promise<EmotionLevels> {
    try {
      const processedPrompt = this.ActionAnalysis(prompt);

      const command = new InvokeModelCommand({
        modelId: 'apac.amazon.nova-pro-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [
            { role: 'user', content: [{ text: processedPrompt }] },
          ],
          inferenceConfig: {
            maxTokens: 4000,
            temperature: 0.8,
            topP: 0.7,
          },
        }),
      });

      const response = await this.client.send(command);
      const body = await response.body.transformToString();
      const parsed = JSON.parse(body);

      let responseText = parsed?.output?.message?.content?.[0]?.text || '';

      if (!responseText) {
        throw new Error('No response text received');
      }

      let finalResult: any;
      try {
        const cleaned = responseText
          .replace(/^```json\s*/, '')
          .replace(/```$/, '')
          .trim();

        finalResult = JSON.parse(cleaned);
      } catch (e) {
        console.warn('Failed to parse cleaned responseText as JSON:', responseText);
        finalResult = { rawText: responseText };
      }

      return finalResult;
    }catch (error) {
      console.error('Error in queryDiaryPatterns:', error);
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }

  }

  async getRecommendComment(activites:string[], emotion:EmotionGroup, dayOfWeek:string): Promise<string> {
    const processedPrompt = this.recommendCommentPrompt(activites, emotion, dayOfWeek);

    const command = new InvokeModelCommand({
      modelId: 'apac.amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: [{ text: processedPrompt }] },
        ],
        inferenceConfig: {
          maxTokens: 4000,
          temperature: 1.0,
          topP: 0.9,
        },
      }),
    });

    const response = await this.client.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    let responseText = parsed?.output?.message?.content?.[0]?.text || 'No response';
    const result = responseText.replace(/\*\*(.*?)\*\*/g, '$1');

    return result;
  }

  async getRAG(query: string, documents: {
    diary_id: number;
    memberId: string;
    sentence: string;
    date: string;
  }[]) {
    console.log(`sentence = ${documents.map(d => d.sentence).join('\n')}`);
    const processedPrompt = promptRAG(query, documents, LocalDate.now().toString());

    const command = new InvokeModelCommand({
      modelId: 'apac.amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: [{ text: processedPrompt }] },
        ],
        inferenceConfig: {
          maxTokens: 4000,
          temperature: 1.0,
          topP: 0.9,
        },
      }),
    });

    const response = await this.client.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    let responseText = parsed?.output?.message?.content?.[0]?.text || 'No response';
    responseText = responseText.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    let result = responseText.replace(/\*\*(.*?)\*\*/g, '$1');
    result = JSON.parse(result);
    console.log(`result = ${JSON.stringify(result)}`)

    return result;
  }

}