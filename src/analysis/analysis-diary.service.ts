import { Injectable } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import {
  ActivityAnalysisDto,
  DiaryAnalysisDto,
  EmotionAnalysisDto,
  PeopleAnalysisDto,
  TodoAnalysisDto,
} from '../diary/dto/diary-analysis.dto';
import {
  CombinedEmotion,
  EmotionInteraction,
  Person,
} from '../util/json.parser';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionType } from '../enums/emotion-type.enum';
import { MemberService } from '../member/member.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Diary } from '../entities/Diary.entity';
import { Repository } from 'typeorm';
import { MemberSummaryService } from '../member/member-summary.service';
import { ActivityService } from '../activity/activity.service';
import { TargetService } from '../target/target.service';
import { EmotionService } from '../emotion/emotion.service';
import { DiarytodoService } from '../diarytodo/diarytodo.service';
import { AchievementService } from '../achievement-cluster/achievement.service';
import { CreateDiaryDto } from '../diary/dto/create-diary.dto';
import { LocalDate } from 'js-joda';
import { auth } from 'neo4j-driver';

@Injectable()
export class AnalysisDiaryService {
  constructor(
    private readonly promptService: ClaudeService,
    private readonly util: CommonUtilService,
    private readonly memberService: MemberService,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    private readonly memberSummaryService: MemberSummaryService,
    private readonly activityService: ActivityService,
    private readonly targetService: TargetService,
    private readonly emotionService: EmotionService,
    private readonly diaryTodoService: DiarytodoService,
    private readonly achievementService: AchievementService,
  ) {}

  async analysisDiary(
    memberId: string,
    dto: CreateDiaryDto,
    imageUrl?: string | null,
  ) {
    const result = await this.promptService.serializeAnalysis(dto.content);

    // // 다이어리 응답 DTO
    // let diaryAnalysisDto = new DiaryAnalysisDto();
    // const activities = result.activity_analysis;
    // const reflection = result.reflection;
    //
    // for (const activity of activities) {
    //   let activityAnalysisDto = new ActivityAnalysisDto();
    //   activityAnalysisDto.activityContent = activity.activity;
    //   activityAnalysisDto.strength = activity.strength === 'None' ? null : activity.strength;
    //
    //   diaryAnalysisDto.activity.push(activityAnalysisDto);
    //
    //   diaryAnalysisDto.people.push(...this.peopleAnalysis(activity.peoples));
    //   diaryAnalysisDto.selfEmotion.push(...this.emotionAnalysis(activity.self_emotions))
    //   diaryAnalysisDto.stateEmotion.push(...this.emotionAnalysis(activity.state_emotions))
    // }
    //
    // diaryAnalysisDto.title = '[가제] 오늘의 일기'; // 일기 타이틀
    // diaryAnalysisDto.content = prompt; // 일기 내용
    //
    // diaryAnalysisDto.todos = this.todoAnalysis(reflection.todo)
    // diaryAnalysisDto.achievements = reflection.achievements;
    // diaryAnalysisDto.shortComings = reflection.shortcomings;
    //
    // return diaryAnalysisDto;

    let author = await this.memberService.findOne(memberId);
    const activity_analysis = result.activity_analysis;
    const reflection = result.reflection;

    const diary = new Diary();
    diary.author = author;
    diary.written_date = dto.writtenDate;
    diary.content = dto.content;
    diary.title = 'demo';
    diary.create_date = LocalDate.now();
    if (dto.weather !== undefined) diary.weather = dto.weather;
    if (dto.latitude !== undefined) diary.latitude = dto.latitude;
    if (dto.longitude !== undefined) diary.longitude = dto.longitude;
    if (imageUrl) {
      diary.photo_path = imageUrl;
    }

    const saveDiary = await this.diaryRepository.save(diary);
    const allPeopleInDiary = activity_analysis.flatMap((a) => a.peoples);
    const selfEmotions: CombinedEmotion[] = activity_analysis.flatMap((a) => [
      ...this.util.toCombinedEmotionTyped(a.self_emotions),
    ]);
    const stateEmotions: CombinedEmotion[] = activity_analysis.flatMap((a) => [
      ...this.util.toCombinedEmotionTyped(a.state_emotions),
    ]);

    const activities = activity_analysis;
    await this.activityService.createByDiary(activities, saveDiary);
    await this.targetService.createByDiary(allPeopleInDiary, saveDiary, author);
    await this.emotionService.createDiaryStateEmotion(stateEmotions, saveDiary);
    await this.emotionService.createDiarySelfEmotion(selfEmotions, saveDiary);
    await this.memberSummaryService.updateSummaryFromDiary(
      this.peopleAnalysis(allPeopleInDiary),
      selfEmotions,
      stateEmotions,
      author,
      dto.writtenDate,
    );
    await this.diaryTodoService.createByDiary(
      reflection.todo,
      saveDiary,
      author,
    );
    await this.achievementService.createByDiary(
      reflection.achievements,
      saveDiary,
      author,
    );

    return saveDiary;
  }

  private todoAnalysis(todos: string[]) {
    let dtos: TodoAnalysisDto[] = [];

    for (const todo of todos) {
      let todoResDto = new TodoAnalysisDto();
      todoResDto.Todocontent = todo;
      dtos.push(todoResDto);
    }

    return dtos;
  }

  private peopleAnalysis(people: Person[]) {
    let dtos: PeopleAnalysisDto[] = [];

    for (const person of people) {
      if (
        person.name === undefined ||
        person.name === null ||
        person.name === '없음'
      )
        continue;
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
    if (!emotion.emotion) return [];

    for (let i = 0; i < emotion.emotion.length; i++) {
      const dto = new EmotionAnalysisDto();
      let emotionType = this.util.parseEnumValue(
        EmotionType,
        emotion.emotion[i],
      );
      // @ts-ignore
      if (emotionType === 'DEFAULT') {
        emotionType = EmotionType.무난;
      }
      dto.emotionType = emotionType;
      dto.intensity = emotion.emotion_intensity[i];
      dtos.push(dto);
    }

    return dtos;
  }
}
