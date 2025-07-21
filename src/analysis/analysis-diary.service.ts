import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService } from '../claude/claude.service';
import {
  EmotionAnalysisDto,
  PeopleAnalysisDto,
  TodoAnalysisDto,
} from '../diary/dto/diary-analysis.dto';
import {
  ActivityAnalysis,
  CombinedEmotion, DiaryAnalysis,
  EmotionInteraction,
  Person,
} from '../util/json.parser';
import { CommonUtilService } from '../util/common-util.service';
import {
  EmotionType,
  RelationEmotions,
  SelfEmotions,
  StateEmotions,
} from '../enums/emotion-type.enum';
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
import { SentenceParserService } from '../sentence-parser/sentence-parser.service';
import { Member } from '../entities/Member.entity';
import { Routine } from 'src/entities/rotine.entity';
import { RoutineEnum } from '../enums/routine.enum';

@Injectable()
export class AnalysisDiaryService {
  private readonly logger = new Logger(AnalysisDiaryService.name);

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
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
  ) {}

  /**
   * 일기를 분석하며 관련된 엔티티들을 저장합니다
   */
  async analysisAndSaveDiary(
    memberId: string,
    dto: CreateDiaryDto,
    imageUrl?: string[] | null,
    audioUrl?: string | null,
  ) {
    let result = await this.promptService.serializeAnalysis(dto.content);
    console.log("일기 분석 완료")
    result = this.filterInvalidEmotionsFromResult(result); // 유효하지 않은 감정 필터링

    let author = await this.memberService.findOne(memberId);
    const activity_analysis = result.activity_analysis;
    const reflection = result.reflection;

    const diary = new Diary();
    diary.author = author;
    diary.written_date = dto.writtenDate;
    diary.content = dto.content;
    diary.title = 'demo';
    diary.create_date = LocalDate.now();
    diary.metadata = JSON.stringify(result);
    if (dto.weather !== undefined) diary.weather = dto.weather;
    if (dto.latitude !== undefined) diary.latitude = dto.latitude;
    if (dto.longitude !== undefined) diary.longitude = dto.longitude;
    if (imageUrl) diary.photo_path = imageUrl;
    if (audioUrl) diary.audio_path = audioUrl;

    const saveDiary = await this.diaryRepository.save(diary);
    const allPeopleInDiary = activity_analysis.flatMap((a) => a.peoples);
    const selfEmotions: CombinedEmotion[] = activity_analysis.flatMap((a) => [
      ...this.util.toCombinedEmotionTyped(a.self_emotions),
    ]);
    const stateEmotions: CombinedEmotion[] = activity_analysis.flatMap((a) => [
      ...this.util.toCombinedEmotionTyped(a.state_emotions),
    ]);

    const activities = activity_analysis;
    await this.targetService.createByDiary(allPeopleInDiary, saveDiary, author);
    await this.activityService.createByDiary(activities, saveDiary);
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

  /**
   * 일기 내용을 파싱해서 태깅된 상태로 반환합니다
   */
  async getTaggingContent(content: string) {
    return this.promptService.getTaggingDiary(content)
  }

  /**
   * 일기를 분석하며 기분 전환 루틴을 찾아 저장합니다
   */
  async analysisAndSaveDiaryRoutine(memberId: string, content: string) {
    const member = await this.memberService.findOne(memberId);

    const response = await this.promptService.serializeRoutine(content);

    let isNewAngerRoutine = false,
      isNewNervousRoutine = false,
      isNewDepressionRoutine = false
    if (response.anger != 'None') {
      isNewAngerRoutine = await this.saveRoutine(member, response.anger, RoutineEnum.STRESS);
    }
    if (response.nervous != 'None') {
      isNewNervousRoutine = await this.saveRoutine(member, response.nervous, RoutineEnum.ANXIETY);
    }
    if (response.depression != 'None') {
      isNewDepressionRoutine = await this.saveRoutine(member, response.depression, RoutineEnum.DEPRESSION);
    }

    return isNewAngerRoutine || isNewNervousRoutine || isNewDepressionRoutine;
  }

  /**
   * 루틴을 저장합니다. 처음에는 트리거 체크가 켜져있어 폴더에 들어가지 않습니다
   */
  private async saveRoutine(
    member: Member,
    content: string,
    routineType: RoutineEnum,
  ) {
    // 이미 있으면 다시 저장할 필요 없음
    const find = await this.routineRepository.findOne({
      where: { member: {id: member.id}, routineType: routineType },
    })
    if (find) return false;

    const entity = new Routine();
    entity.member = member;
    entity.routineType = routineType;
    entity.content = content;
    entity.isTrigger = true;
    this.logger.log(`루틴 생성, 타입 : ${routineType}, 루틴 : ${content}`)

    await this.routineRepository.save(entity);
    return true
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
      const emotionType = this.util.parseEnumValue(
        EmotionType,
        emotion.emotion[i],
      );

      if (emotionType === null) {
        // 유효하지 않은 감정은 필터링
        continue;
      }

      const dto = new EmotionAnalysisDto();
      dto.emotionType = emotionType;
      dto.intensity = emotion.emotion_intensity[i];
      dtos.push(dto);
    }

    return dtos;
  }

  /**
   * 분석 결과에서 EmotionType에 정의되지 않은 감정들을 필터링합니다.
   * @param result Claude AI 분석 결과
   * @returns 유효한 감정만 포함된 분석 결과
   */
  private filterInvalidEmotionsFromResult(result: DiaryAnalysis): DiaryAnalysis {
    if (!result || !result.activity_analysis) {
      return result;
    }

    result.activity_analysis.forEach((activity: ActivityAnalysis) => {
      // self_emotions 필터링
      if (activity.self_emotions) {
        const validSelfEmotions: string[] = [];
        const validSelfIntensities: number[] = [];
        activity.self_emotions.emotion.forEach((emotionStr, index) => {
          const emotion = this.util.parseEnumValue(EmotionType, emotionStr);
          if (emotion && SelfEmotions.includes(emotion)) {
            validSelfEmotions.push(emotionStr);
            validSelfIntensities.push(
              activity.self_emotions.emotion_intensity[index],
            );
          }
        });
        activity.self_emotions.emotion = validSelfEmotions;
        activity.self_emotions.emotion_intensity = validSelfIntensities;
      }

      // state_emotions 필터링
      if (activity.state_emotions) {
        const validStateEmotions: string[] = [];
        const validStateIntensities: number[] = [];
        activity.state_emotions.emotion.forEach((emotionStr, index) => {
          const emotion = this.util.parseEnumValue(EmotionType, emotionStr);
          if (emotion && StateEmotions.includes(emotion)) {
            validStateEmotions.push(emotionStr);
            validStateIntensities.push(
              activity.state_emotions.emotion_intensity[index],
            );
          }
        });
        activity.state_emotions.emotion = validStateEmotions;
        activity.state_emotions.emotion_intensity = validStateIntensities;
      }

      // peoples 내 interactions의 emotion 필터링
      if (activity.peoples && Array.isArray(activity.peoples)) {
        activity.peoples.forEach((person: Person) => {
          if (person.interactions) {
            const validPersonEmotions: string[] = [];
            const validPersonIntensities: number[] = [];
            person.interactions.emotion.forEach((emotionStr, index) => {
              const emotion = this.util.parseEnumValue(
                EmotionType,
                emotionStr,
              );
              if (emotion && RelationEmotions.includes(emotion)) {
                validPersonEmotions.push(emotionStr);
                validPersonIntensities.push(
                  person.interactions.emotion_intensity[index],
                );
              }
            });
            person.interactions.emotion = validPersonEmotions;
            person.interactions.emotion_intensity = validPersonIntensities;
          }
        });
      }
    });
    return result;
  }
}
