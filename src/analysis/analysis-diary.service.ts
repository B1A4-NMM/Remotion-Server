import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import {
  ActivityAnalysisDto,
  DiaryAnalysisDto,
  EmotionAnalysisDto,
  PeopleAnalysisDto, TodoResDto,
} from '../graph/diray/dto/diary-analysis.dto';
import { Emotion } from '../entities/Emotion.entity';
import { EmotionInteraction } from '../util/json.parser';

@Injectable()
export class AnalysisDiaryService {
  constructor(private readonly promptService: ClaudeService) {}

  async analysisDiary(prompt: string): Promise<DiaryAnalysisDto> {
    const result = await this.promptService.queryDiaryPatterns(prompt);

    // 다이어리 응답 DTO
    let diaryAnalysisDto = new DiaryAnalysisDto();
    const activities = result.activity_analysis;
    const reflection = result.reflection;

    for (const activity of activities) {
      let activityAnalysisDto = new ActivityAnalysisDto();
      activityAnalysisDto.activityTitle = activity.activity;

      diaryAnalysisDto.activity.push(activityAnalysisDto);

      for (const person of activity.peoples) {
        let peopleAnalysisDto = new PeopleAnalysisDto();
        peopleAnalysisDto.name = person.name;

        const raw = person.interactions
        for (let i = 0; i < raw.emotion.length; i++) {
          let emotionAnalysisDto = new EmotionAnalysisDto();
          emotionAnalysisDto.type = raw.emotion[i]
          emotionAnalysisDto.intensity = raw.emotion_intensity[i]
          peopleAnalysisDto.feel.push( emotionAnalysisDto )
        }

        diaryAnalysisDto.people.push(peopleAnalysisDto);
      }
    }

    diaryAnalysisDto.title = '[가제] 오늘의 일기'
    diaryAnalysisDto.content = prompt

    for (const todo of reflection.todo) {
      let todoResDto = new TodoResDto()
      todoResDto.content = todo
      diaryAnalysisDto.todos.push(todoResDto)
    }

    return diaryAnalysisDto
  }

  private emotionAnalysis(emotion: EmotionInteraction) {
    let dto = new EmotionAnalysisDto();

    for (let i = 0; i < emotion.emotion.length; i++) {
      dto.type = emotion.emotion[i]
      dto.intensity = emotion.emotion_intensity[i]
    }

    return dto
  }
}