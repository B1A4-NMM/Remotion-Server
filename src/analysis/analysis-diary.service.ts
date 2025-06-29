import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import {
  ActivityAnalysisDto,
  DiaryAnalysisDto,
  EmotionAnalysisDto,
  PeopleAnalysisDto,
} from '../graph/diray/dto/diary-analysis.dto';

@Injectable()
export class AnalysisDiaryService {
  constructor(private readonly promptService: ClaudeService) {}

  async analysisDiary(prompt: string): Promise<DiaryAnalysisDto> {
    // ✅ 병렬로 실행 시작
    const result = await this.promptService.queryDiaryPatterns(prompt);

    // ✅ 둘 다 끝나기를 기다림 (동시에)
    let diaryAnalysisDto = new DiaryAnalysisDto();
    const activities = result.activity_analysis;

    for (const activity of activities) {
      let activityAnalysisDto = new ActivityAnalysisDto();
      activityAnalysisDto.activityTitle = activity.activity;
      // console.log(`activity name = ${activity.activity}`)

      diaryAnalysisDto.activity.push(activityAnalysisDto);

      for (const person of activity.peoples) {
        let peopleAnalysisDto = new PeopleAnalysisDto();
        // console.log(`person name = ${person.name}`)
        peopleAnalysisDto.name = person.name;

        let emotionAnalysisDto = new EmotionAnalysisDto();
        emotionAnalysisDto.emotion = person.interactions.emotion
        emotionAnalysisDto.subEmotion = person.interactions.sub_emotions
        emotionAnalysisDto.intensity = person.interactions.emotion_intensity

        peopleAnalysisDto.feel = emotionAnalysisDto;
        diaryAnalysisDto.people.push(peopleAnalysisDto);
      }
    }

    diaryAnalysisDto.title = '[가제] 오늘의 일기'
    diaryAnalysisDto.content = prompt

    return diaryAnalysisDto
  }
}