import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import {
  ActivityAnalysisDto,
  DiaryAnalysisDto,
  EmotionAnalysisDto,
  PeopleAnalysisDto,
  TodoAnalysisDto,
} from './dto/diary-analysis.dto';
import {  EmotionInteraction, Person } from '../util/json.parser';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionType } from '../enums/emotion-type.enum';

@Injectable()
export class AnalysisDiaryService {
  constructor(
    private readonly promptService: ClaudeService,
    private readonly util: CommonUtilService,
  ) {}

  async analysisDiary(prompt: string): Promise<DiaryAnalysisDto> {
    const result = await this.promptService.serializeAnalysis(prompt);

    // 다이어리 응답 DTO
    let diaryAnalysisDto = new DiaryAnalysisDto();
    const activities = result.activity_analysis;
    const reflection = result.reflection;

    for (const activity of activities) {
      let activityAnalysisDto = new ActivityAnalysisDto();
      activityAnalysisDto.activityContent = activity.activity;
      activityAnalysisDto.strength = activity.strength === 'None' ? null : activity.strength;

      diaryAnalysisDto.activity.push(activityAnalysisDto);

      diaryAnalysisDto.people.push(...this.peopleAnalysis(activity.peoples));
      diaryAnalysisDto.selfEmotion.push(...this.emotionAnalysis(activity.self_emotions))
      diaryAnalysisDto.stateEmotion.push(...this.emotionAnalysis(activity.state_emotions))
    }

    diaryAnalysisDto.title = '[가제] 오늘의 일기'; // 일기 타이틀
    diaryAnalysisDto.content = prompt; // 일기 내용

    diaryAnalysisDto.todos = this.todoAnalysis(reflection.todo)

    return diaryAnalysisDto;
  }

  private todoAnalysis(todos: string[]) {
    let dtos: TodoAnalysisDto[] = [];

    for (const todo of todos) {
      let todoResDto = new TodoAnalysisDto();
      todoResDto.Todocontent = todo;
      dtos.push(todoResDto);
    }

    return dtos
  }

  private peopleAnalysis(people: Person[]) {
    let dtos: PeopleAnalysisDto[] = [];

    for (const person of people) {
      if (person.name === undefined || person.name === null || person.name === "없음") continue;
      let peopleAnalysisDto = new PeopleAnalysisDto();
      peopleAnalysisDto.name = person.name;
      const emotionInteraction = person.interactions;
      peopleAnalysisDto.feel = this.emotionAnalysis(emotionInteraction);
      dtos.push(peopleAnalysisDto);
    }

    return dtos;
  }

  private emotionAnalysis(emotion: EmotionInteraction) {
    let dtos: EmotionAnalysisDto[] = [];
    if (!emotion.emotion)
      return []

    for (let i = 0; i < emotion.emotion.length; i++) {
      const dto = new EmotionAnalysisDto();
      let emotionType = this.util.parseEnumValue(EmotionType,emotion.emotion[i]);
      // @ts-ignore
      if (emotionType === "DEFAULT") {
        emotionType = EmotionType.무난
      }
      dto.emotionType = emotionType;
      dto.intensity = emotion.emotion_intensity[i];
      dtos.push(dto);
    }

    return dtos;
  }
}