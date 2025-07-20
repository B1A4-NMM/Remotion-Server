import { Injectable } from '@nestjs/common';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';
import { DiaryAnalysis } from '../util/json.parser';
import {
  PROMPT_ANALYZE,
  PROMPT_ROUTINE,
  PROMPT_VALIDATE,
  promptRAG, taggingPrompt,
} from '../constants/prompt.constants';
import { EmotionLevels } from '../util/routine.parser';
import { EmotionGroup } from '../enums/emotion-type.enum';
import { LocalDate } from 'js-joda';
import { CommonUtilService } from '../util/common-util.service';

export interface SimilarSentence {
  diary_id: number;
  sentence: string;
  is_similar: boolean;
}

@Injectable()
export class ClaudeService {
  private readonly client: BedrockRuntimeClient;
  private readonly sonnetClient: BedrockRuntimeClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly utilService: CommonUtilService,
  ) {
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

    // @ts-ignore
    this.sonnetClient = new BedrockRuntimeClient({
      region: this.configService.get<string>('AWS_SONNET_REGION'),
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
너는 감정 기반 일기에서 핵심 활동과 감정을 담은 **한 줄짜리 제목**을 만들어야 한다.

규칙:
1. 전체 일기 중 가장 핵심적인 활동 또는 감정을 중심으로 제목을 구성하라.
2. 활동과 감정이 함께 드러나면 더 좋다.
3. *30자 내외**로 작성하면 좋지만, 꼭 지키지는 않아도 된다
4. "오늘은"처럼 일기체로 시작하지 말고, **책 제목이나 기사 제목처럼** 쓸 것.
5. 문장은 자연스럽고 간결하게, 감정이 묻어나게 작성하라.
6. 반드시 **한 문장**으로만 응답해야 하고, 자연스럽게 끝나도록 완결된 문장으로 작성할 것.
7. 쌍따옴표(")로 감싸지 말고, 순수한 텍스트로만 응답하라.

예시:
- 카페에서 친구들과 수다를 떤 여유로운 하루  
- 피드백을 세게 받아 하루종일 우울한 날  
- 애인과 싸워서 화가 머리끝까지 난 하루  
- 회의 준비에 지쳐 무기력한 하루  
- 산책하며 마음이 조금은 가벼워진 날
- 새벽 기차를 타고 러시아에 도착

다음은 일기이다. 이 일기를 위 기준에 따라 제목 한 줄로 요약하라.

일기:
${prompt}
`;
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

  private recommendCommentPrompt(
    activity: string,
    emotion: EmotionGroup,
    dayOfWeek: string,
  ): string {
    return `
당신은 사용자에게 내일의 감정 상태를 기반으로 기분 전환을 도와줄 활동을 추천하는 역할을 합니다.

- 오늘은 ${dayOfWeek}입니다.
- 사용자는 이 요일마다 '${emotion}' 감정을 자주 느낍니다.
- 사용자는 ${activity} 를 통해 긍정적인 감정을 느낍니다

당신은 사용자에게 위로가 되는 **짧고 정중한 추천 멘트 1줄**과 **감성적인 한마디 1줄**을 작성해야 합니다.

출력 조건:
- 추천 멘트는 "~요", "~해보는 건 어떨까요?" 와 같은 자연스러운 정중체를 사용할 것
- 추천 활동은 문장 흐름에 자연스럽게 녹여낼 것
- '**', 이모지, 감탄사(!), 그리고 멘트 외의 문장 삽입은 금지
- 총 2줄 이내로 작성

예시:
1. 화요일마다 스트레스를 많이 받으시네요. 명상을 통해 마음을 가다듬어보는 건 어떨까요?  
   오늘 하루, 나를 위한 시간을 가져보세요.

이제 위 정보를 참고해 출력하세요.
`;
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

    const response = await this.getResponseToSonnet4(processedPrompt);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    return parsed?.content?.[0]?.text || 'No response';
  }

  async serializeAnalysis(prompt: string): Promise<DiaryAnalysis> {
    return this.queryDiaryPatterns(prompt);
  }

  async queryDiaryPatterns(prompt: string): Promise<DiaryAnalysis> {
    try {
      // 1. 1차 분석: LLM을 통해 일기에서 패턴 추출
      const analysisPrompt = this.patternAnalysisPrompt(prompt);
      // let response = await this.getResponseToNovaPro(analysisPrompt, 0.05, 0.9);
      const response = await this.getResponseToSonnet3(analysisPrompt);
      if (!response || response === 'No response') {
        throw new Error('Initial analysis failed to produce a response.');
      }

      // // 2. 2차 검증: LLM이 스스로 결과를 검증하고 수정
      // const validationPrompt = this.resultAnalysis(response);
      // response = await this.getResponseToNovaPro(validationPrompt, 0.05, 0.9);
      // if (!response || response === 'No response') {
      //   throw new Error('Validation step failed to produce a response.');
      // }

      // 3. 응답 정제 및 파싱
      const cleanedJson = this._cleanJsonResponse(response);
      const parsedResponse = JSON.parse(cleanedJson);

      // 4. 심리적 거리 계산 및 적용
      this._applyPsychologicalDistance(parsedResponse);

      return parsedResponse;
    } catch (error) {
      console.error(`Pattern analysis failed: ${error.message}`, error.stack);
      if (error instanceof SyntaxError) {
        throw new Error('Failed to parse the analysis result as JSON.');
      }
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * LLM 응답에서 마크다운 코드 블록을 제거하여 순수한 JSON 문자열을 추출합니다.
   * @param text 원본 텍스트
   * @returns 정제된 JSON 문자열
   */
  private _cleanJsonResponse(text: string): string {
    let cleaned = text.replace(/``````\s*$/g, '').trim();
    const startIndex = cleaned.indexOf('{');
    const endIndex = cleaned.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
      return cleaned.substring(startIndex, endIndex + 1);
    }
    return cleaned;
  }

  /**
   * 분석된 데이터에 포함된 인물 정보를 바탕으로 심리적 거리를 계산하고 적용합니다.
   * @param analysisData 파싱된 분석 데이터 객체
   */
  private _applyPsychologicalDistance(analysisData: any): void {
    if (!analysisData?.peoples || !Array.isArray(analysisData.peoples)) {
      return;
    }

    const emotion_weights = {
      행복: 1.0, 기쁨: 1.0, 신남: 1.0, 설렘: 0.95, 유대: 0.95,
      신뢰: 0.95, 친밀: 0.9, 그리움: 0.9, 자신감: 0.9, 서운: 0.8,
      평온: 0.8, 안정: 0.8, 편안: 0.75, 소외: 0.65, 불안: 0.65,
      실망: 0.65, 기대: 0.6, 속상: 0.6, 상처: 0.5, 감사: 0.5,
      무난: 0.5, 차분: 0.5, 긴장: 0.45, 화남: 0.4, 짜증: 0.4,
      무기력: 0.35, 지침: 0.3, 지루: 0.3, 억울: 0.3, 외로움: 0.25,
      우울: 0.25, 공허: 0.2, 초조: 0.2, 부담: 0.15, 어색: 0.1,
      불편: 0.05, 단절: 0.05,
    };
    const time_mapping = {
      all: 24, most: 12, some: 6, little: 3, moment: 1, None: 0,
    };

    const getEmotionWeight = (emotion: string) => emotion_weights[emotion] || 0.1;

    analysisData.peoples.forEach((person: any) => {
      const interactions = person.interactions || {};
      const intensity = interactions.emotion_intensity || 0;
      const main_emotion = interactions.emotion || '';
      const sub_emotions = interactions.sub_emotions || [];
      const mentions = interactions.mentions || 1;
      const duration = interactions.duration || 'None';
      const similarity = person.social_similarity || {};

      const main_emotion_weight = getEmotionWeight(main_emotion);
      let avg_sub_emotion_weight = 0;
      if (sub_emotions.length > 0) {
        const sub_emotion_weights = sub_emotions.map(getEmotionWeight);
        avg_sub_emotion_weight =
          sub_emotion_weights.reduce((a, b) => a + b, 0) / sub_emotions.length;
      }

      const final_emotion_weight = main_emotion_weight * 0.7 + avg_sub_emotion_weight * 0.3;
      const duration_value = time_mapping[duration] || 0;
      const social_similarity_score =
        (similarity.name_intimacy || 0) * 0.3 +
        (similarity.shared_activity || 0) * 0.2 +
        (similarity.information_sharing || 0) * 0.2 +
        (similarity.emotional_expression || 0) * 0.3;

      const alpha = 1.0, beta = 0.4, gamma = 0.25, delta = 0.2, epsilon = 0.7;

      const psychological_distance =
        alpha * intensity * (1 - final_emotion_weight) +
        beta * Math.log(duration_value + 1) +
        gamma * (mentions > 0 ? Math.pow(mentions, -1) : 1) +
        delta * duration_value -
        epsilon * social_similarity_score;

      person.psychological_distance = Math.max(0.1, psychological_distance);
    });
  }

  // 루틴 추출 메서드
  async serializeRoutine(prompt: string): Promise<EmotionLevels> {
    try {
      const processedPrompt = this.ActionAnalysis(prompt);

      let responseText = await this.getResponseToSonnet4(processedPrompt);

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
        console.warn(
          'Failed to parse cleaned responseText as JSON:',
          responseText,
        );
        finalResult = { rawText: responseText };
      }

      return finalResult;
    } catch (error) {
      console.error('Error in queryDiaryPatterns:', error);
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }
  async getRecommendComment(
    activites: string,
    emotion: EmotionGroup,
    dayOfWeek: string,
  ): Promise<string> {
    const processedPrompt = this.recommendCommentPrompt(
      activites,
      emotion,
      dayOfWeek,
    );

    const response = await this.getResponseToNovaLite(processedPrompt, 1.0, 0.9);
    const result = response.replace(/\*\*(.*?)\*\*/g, '$1');

    return result;
  }

  /**
   * RAG를 위한 LLM 질의
   */
  async getSearchDiary(
    query: string,
    documents: {
      diary_id: number;
      memberId: string;
      sentence: string;
      date: string;
    }[],
  ): Promise<SimilarSentence[]> {
    console.log(`sentence = ${documents.map((d) => d.sentence).join('\n')}`);
    const processedPrompt = promptRAG(
      query,
      documents,
      LocalDate.now().toString(),
    );

    let responseText = await this.getResponseToSonnet4(processedPrompt);

    responseText = responseText
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');

    let result = responseText.replace(/\*\*(.*?)\*\*/g, '$1');
    result = JSON.parse(result);
    console.log(`result = ${JSON.stringify(result)}`);

    return result;
  }

  /**
   * 일기 태깅 
   */
  async getTaggingDiary(content:string){
    const prompt = taggingPrompt(content)
    const response = await this.getResponseToSonnet4(prompt);

    return response;
  }

  private async getResponseToSonnet4(processedPrompt: string) {
    const command = new InvokeModelCommand({
      modelId: 'apac.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        messages: [{ role: 'user', content: processedPrompt }],
        max_tokens: 4000,
        temperature : 0.05,
      }),
    });

    const response = await this.sonnetClient.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    let responseText = parsed?.content?.[0]?.text || 'No response';
    return responseText;
  }

  private async getResponseToSonnet3(processedPrompt: string) {
    const command = new InvokeModelCommand({
      modelId: 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        messages: [{ role: 'user', content: processedPrompt }],
        max_tokens: 4000,
        temperature : 0,
        top_p: 0.9,
        top_k: 10
      }),
    });

    const response = await this.sonnetClient.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    let responseText = parsed?.content?.[0]?.text || 'No response';
    return responseText;
  }

  private async getResponseToNovaPro(processedPrompt: string, temperature:number, topP:number) {
    const command = new InvokeModelCommand({
      modelId: 'apac.amazon.nova-pro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{ role: 'user', content: [{ text: processedPrompt }] }],
        inferenceConfig: {
          maxTokens: 4000,
          temperature: temperature,
          topP: topP,
        },
      }),
    });

    const response = await this.client.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    return parsed?.output?.message?.content?.[0]?.text || 'No response';
  }

  private async getResponseToNovaLite(processedPrompt: string, temperature:number, topP:number) {
    const command = new InvokeModelCommand({
      modelId: 'apac.amazon.nova-lite-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{ role: 'user', content: [{ text: processedPrompt }] }],
        inferenceConfig: {
          maxTokens: 4000,
          temperature: temperature,
          topP: topP,
        },
      }),
    });

    const response = await this.client.send(command);
    const body = await response.body.transformToString();
    const parsed = JSON.parse(body);

    return parsed?.output?.message?.content?.[0]?.text || 'No response';
  }
}
