import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { EmotionService } from '../emotion/emotion.service';
import { TodoService } from '../todo/todo.service';
import { ActivityService } from '../activity/activity.service';
import { TargetService } from '../target/target.service';
import { CommonUtilService } from '../util/common-util.service';
import { DiarytodoService } from '../diarytodo/diarytodo.service';

import { DiaryListRes, DiaryRes } from './dto/diary-list.res';
import { DiaryHomeRes } from './dto/diary-home.res';

import { DiaryTodo } from '../entities/diary-todo.entity';
import { Diary } from '../entities/Diary.entity';

import {
  ActivityAnalysisDto,
  DiaryAnalysisDto,
  EmotionAnalysisDto,
  PeopleAnalysisDto,
  TodoAnalysisDto,
} from '../analysis/dto/diary-analysis.dto';
import { CreateDiaryDto } from './dto/create-diary.dto';



@Injectable()
export class DiaryService {
  private readonly logger= new Logger(DiaryService.name);
  constructor(
    private readonly analysisDiaryService: AnalysisDiaryService,
    private readonly memberService: MemberService,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,

    @InjectRepository(DiaryTodo)
    private readonly diaryTodoRepository: Repository<DiaryTodo>,

    private readonly activityService: ActivityService,
    private readonly targetService: TargetService,
    private readonly todoService: TodoService,
    private readonly utilService: CommonUtilService,
    private readonly emotionService: EmotionService,
    private readonly diaryTodoService : DiarytodoService,
    
  ) {}

  /**
   * 다이어리 생성 함수
   * 다이어리를 생성하면서 일기를 분석하고, 분석한 결과를 dto에 저장
   * 연관된 엔티티 : [ Activity, Target, DiaryTarget, DiaryEmotion ]
   */
  async createDiary(memberId: string, dto: CreateDiaryDto) {
    this.logger.log('다이어리 생성')
    const result = await this.analysisDiaryService.analysisDiary(dto.content);

    const member = await this.memberService.findOne(memberId);
    const diary = new Diary();
    diary.author = member;
    diary.written_date = dto.writtenDate;
    diary.content = dto.content;
    diary.title = 'demo';

    const saveDiary = await this.diaryRepository.save(diary);
    

    //activity & target & todo 은 여러개라서 따로 처리 => 다른 레이어라서 상관없음 
    await this.activityService.createByDiary(result, saveDiary);
    await this.targetService.createByDiary(result, saveDiary, memberId);
    await this.diaryTodoService.createByDiary(result,saveDiary,member);

    this.logger.log(`생성 다이어리 { id : ${saveDiary.id}, author : ${member.nickname} }`)

    return this.getDiary(memberId, saveDiary.id);
    
  }

  /**
   * 사용자가 작성한 모든 일기들을 목록으로 보여줌
   * 페이징이 필요할지도?
   */
  async getDiaryList(memberId: string) {
    const member = await this.memberService.findOne(memberId);
    const diaries = await this.diaryRepository.find({
      where: { author: member },
      order: {
        written_date: 'DESC',
      },
      relations: ['diaryTargets', 'diaryTargets.target', 'diaryEmotions'],
    });

    const res = this.buildDiaryList(diaries);

    return res;
  }

  /**
   *  홈 화면에서 보여질 정보들을 추출
   *  RETURN [ 오늘의 감정 , 오늘 작성한 일기 (감정, 대상) ] 
   */
  async getHomeDiaries(memberId: string): Promise<DiaryHomeRes> {
    const diaries = await this.getTodayDiaries(memberId);
    const todayEmotions = await this.emotionService.getTodayEmotions(memberId);
    const result = new DiaryHomeRes();
    result.todayDiaries = diaries.diaries;
    result.todayEmotions = todayEmotions;
    return result;
  }

  /**
   * 오늘 작성한 일기 가져오기
   */
  private async getTodayDiaries(memberId: string) {
    const date = this.utilService.getCurrentDateToISOString();
    return this.getDiariesByDate(memberId, date);
  }

  /**
   * 멤버의 일기 중 날짜에 해당하는 일기들을 반환합니다
   * RETURN DiaryListRes
   */
  async getDiariesByDate(memberId: string, date: Date) {
    const member = await this.memberService.findOne(memberId);
    const diaries = await this.diaryRepository.find({
      where: { author: member, written_date: date },
      relations: ['diaryTargets', 'diaryTargets.target', 'diaryEmotions'],
    });

    const res = this.buildDiaryList(diaries);
    return res;
  }

  /**
   * 다이어리 엔티티 배열을 인자로 받아 DTO로 변환합니다
   * 그 과정에서 연관된 감정, 대상들도 같이 가져옵니다
   * RETURN DiaryListRes
   */
  private buildDiaryList(diaries: Diary[]) {
    const res: DiaryListRes = new DiaryListRes();
    for (const diary of diaries) {
      let diaryRes = new DiaryRes();
      diaryRes.diaryId = diary.id;
      diaryRes.title = diary.title;
      diaryRes.writtenDate = diary.written_date;

      diary.diaryEmotions.forEach((emotion) => {
        if (!diaryRes.emotions.includes(emotion.emotion)) // 중복 방지
          diaryRes.emotions.push(emotion.emotion);
      });

      diary.diaryTargets.forEach((target) => {
        diaryRes.targets.push(target.target.name);
      });

      res.diaries.push(diaryRes);
    }
    return res;
  }

  /**
   * id로 작성한 일기 하나를 보여줌.
   * 분석한 결과도 같이 dto로 전달
   */
  async getDiary(memberId: string, id: number) {
    this.logger.log('일기 단일 조회')
    const diary = await this.diaryRepository.findOne({
      where: { id: id },
      relations: [
        'diaryTargets',
        'diaryTargets.target',
        'diaryTargets.target.emotionTargets',
        'activities',
        'diaryTodos',
      ],
    });

    if (diary === null) {
      throw new NotFoundException('해당 일기가 없습니다');
    }

    if (diary.author.id != memberId) {
      throw new NotFoundException('해당 일기의 주인이 아닙니다');
    }

    return this.createDiaryAnalysis(diary);
  }

  /**
   * 일기를 인자로 받아 일기에 연관된 엔티티들을 같이 보여줌
   * [ 대상, 감정, 사건 ]
   * RETURN: DiaryAnalysisDto
   */
  async createDiaryAnalysis(diary: Diary) {
    const result = new DiaryAnalysisDto();
    result.content = diary.content
    result.id = diary.id

    diary.activities.forEach((activity) => {
      const activityDto = new ActivityAnalysisDto();
      activityDto.activityContent = activity.content;
      result.activity.push(activityDto);
    });

    diary.diaryTargets.forEach((target) => {
      const peopleDto = new PeopleAnalysisDto();
      target.target.emotionTargets.forEach((emotionTarget) => {
        const peopleEmotionsDto = new EmotionAnalysisDto();
        peopleEmotionsDto.emotionType = emotionTarget.emotion;
        peopleEmotionsDto.intensity = emotionTarget.emotion_intensity;
        peopleDto.feel.push(peopleEmotionsDto);
      });

      peopleDto.name = target.target.name;
      result.people.push(peopleDto);
    });

    //diaryTodo => TodoResDto로 매핑 (응답 주고 받을 때 통일 형식)
    diary.diaryTodos.forEach((diaryTodo) =>{
      const todoDto = new TodoAnalysisDto;
      console.log('todo 조회중')
      todoDto.Todocontent =diaryTodo.content;
      result.todos.push(todoDto);
    })

    return result;
  }

  /**
   * 커서를 통해 일기를 가져옴
   * 연관된 감정이나 사건, 대상은 가져오지 않음
   */
  async getDiariesInfinite(
    memberId: string,
    limit: number,
    cursor?: { id: number },
  ): Promise<{
    items: Diary[];
    hasMore: boolean;
    nextCursor: { writtenDate: Date; id: number } | null;
  }> {
    // 요청마다 limit+1 개 가져와서 hasMore 판별
    const take = limit + 1;

    // QueryBuilder 셋업
    const qb = this.diaryRepository
      .createQueryBuilder('d')
      .where('d.author_id = :memberId', { memberId })
      .orderBy('d.written_date', 'DESC')
      .addOrderBy('d.id', 'DESC')
      .take(take);

    // cursor가 있으면 이후(더 아래) 데이터만
    if (cursor) {
      qb.andWhere(`(d.id < :id)`, { id: cursor.id });
    }

    const rows = await qb.getMany();

    // hasMore, nextCursor 계산
    const hasMore = rows.length === take;
    const items = hasMore ? rows.slice(0, -1) : rows;

    const nextCursor: { writtenDate: Date; id: number } | null = hasMore
      ? {
          writtenDate: items[items.length - 1].written_date,
          id: items[items.length - 1].id,
        }
      : null;

    return { items, hasMore, nextCursor };
  }
}
