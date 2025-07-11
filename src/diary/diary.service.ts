import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { EmotionService } from '../emotion/emotion.service';
import { DiaryListRes, DiaryRes } from './dto/diary-list.res';
import { DiaryHomeRes } from './dto/diary-home.res';
import { Diary } from '../entities/Diary.entity';
import {
  ActivityAnalysisDto,
  DiaryAnalysisDto,
  EmotionAnalysisDto,
  PeopleAnalysisDto,
  TodoAnalysisDto,
} from './dto/diary-analysis.dto';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { EmotionBase } from '../enums/emotion-type.enum';
import { LocalDate } from 'js-joda';
import { MemberSummary } from '../entities/member-summary.entity';
import { SentenceParserService } from '../sentence-parser/sentence-parser.service';

@Injectable()
export class DiaryService {
  private readonly logger = new Logger(DiaryService.name);

  constructor(
    private readonly analysisDiaryService: AnalysisDiaryService,
    private readonly memberService: MemberService,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    private readonly emotionService: EmotionService,
    @InjectRepository(MemberSummary)
    private readonly summaryRepo: Repository<MemberSummary>,
    private readonly sentenceParserService: SentenceParserService,
  ) {}

  async findMemberSummaryByDateAndPeriod(memberId: string, diaryId:number, period: number) {

    const diary = await this.diaryRepository.findOneOrFail({where: {id: diaryId}})
    const date = diary.written_date;

    const member = await this.memberService.findOne(memberId);
    const end = date.minusDays(period);
    const summary = await this.summaryRepo.find({
      where: { member: member, date: Between(end, date) },
      relations: ['emotionScores'],
    });

    return this.memberService.createMemberSummaryRes(summary, period)
  }

  async deleteDiary(memberId: string, id: number) {
    const diary = await this.diaryRepository.findOneOrFail({
      where: { id: id },
    });

    if (diary.author.id != memberId) {
      throw new NotFoundException('해당 일기의 주인이 아닙니다')
    }

    await this.sentenceParserService.deleteAllByDiaryId(diary.id)
    return await this.diaryRepository.delete(diary.id);
  }

  /**
   * 다이어리 생성 함수
   * 다이어리를 생성하면서 일기를 분석하고, 분석한 결과를 dto에 저장
   * 연관된 엔티티 : [ Activity, Target, DiaryTarget, DiaryEmotion ]
   */
  async createDiary(
    memberId: string,
    dto: CreateDiaryDto,
    imageUrl?: string | null,
  ) {
    this.logger.log('다이어리 생성');
    const result = await this.analysisDiaryService.analysisDiary(
      memberId,
      dto,
      imageUrl,
    );

    this.logger.log(
      `생성 다이어리 { id : ${result.id}, author : ${result.author.nickname} }`,
    );

    this.logger.log(`일기의 주인 : ${result.author.id}, 글쓴이 : ${memberId}`);

    return result.id;
  }

  async getDiaryByDate(memberId: string, date: LocalDate) {
    const member = await this.memberService.findOne(memberId);

    const diaries = await this.diaryRepository.find({
      where: { author: member, written_date: date },
      relations: ['diaryTargets', 'diaryTargets.target', 'diaryEmotions'],
    });

    const res = this.buildDiaryList(diaries);
    return res;
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
   * 날짜와 멤버 정보를 받아 다른 날짜의 일기 정보 출력
   */
  async getDiaryInfoByDate(memberId: string, date: LocalDate) {
    const diaries = await this.getDiaryByDate(memberId, date);
    const emotions = await this.emotionService.getEmotionsByDate(memberId, date.toString())
    const result = new DiaryHomeRes();
    result.todayDiaries = diaries.diaries;
    result.todayEmotions = emotions
    return result;
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
    const date = LocalDate.now();
    return this.getDiariesByDate(memberId, date);
  }

  async getDiariesByDate(memberId: string, date: LocalDate) {
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
      diaryRes.content = diary.content;

      for (const emotion of diary.diaryEmotions) {
        if (!diaryRes.emotions.includes(emotion.emotion))
          // 중복 방지
          diaryRes.emotions.push(emotion.emotion);
      }

      for (const target of diary.diaryTargets) {
        diaryRes.targets.push(target.target.name);
      }

      res.diaries.push(diaryRes);
    }
    return res;
  }

  async getDiaryJson(memberId: string, id: number) {
    const diary = await this.diaryRepository.findOneOrFail({
      where: { id: id },
    });

    if (diary.author.id != memberId) {
      throw new NotFoundException('해당 일기의 주인이 아닙니다');
    }

    return diary.metadata
  }

  /**
   * id로 작성한 일기 하나를 보여줌.
   * 분석한 결과도 같이 dto로 전달
   * RETURN: DiaryAnalysisDto
   */
  async getDiary(memberId: string, id: number): Promise<DiaryAnalysisDto> {
    this.logger.log('일기 단일 조회');
    const diary = await this.diaryRepository.findOne({
      where: { id: id },
      relations: [
        'diaryTargets',
        'diaryTargets.target',
        'diaryTargets.target.emotionTargets',
        'activities',
        'diaryTodos',
        'diaryEmotions',
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
  async createDiaryAnalysis(diary: Diary): Promise<DiaryAnalysisDto> {
    const result = new DiaryAnalysisDto();
    result.content = diary.content;
    result.title = diary.title;
    result.photo_path = diary.photo_path;
    result.id = diary.id;

    for (const activity of diary.activities) {
      const activityDto = new ActivityAnalysisDto();
      activityDto.activityContent = activity.content;
      activityDto.strength = activity.strength;
      result.activity.push(activityDto);
    }

    const emotions = diary.diaryEmotions;
    for (const emotion of emotions) {
      let dto = new EmotionAnalysisDto();
      dto.emotionType = emotion.emotion;
      dto.intensity = emotion.intensity;
      switch (emotion.emotionBase) {
        case EmotionBase.State:
          result.stateEmotion.push(dto);
          break;
        case EmotionBase.Self:
          result.selfEmotion.push(dto);
      }
    }

    for (const target of diary.diaryTargets) {
      const peopleDto = new PeopleAnalysisDto();
      for (const emotionTarget of target.target.emotionTargets) {
        const peopleEmotionsDto = new EmotionAnalysisDto();
        peopleEmotionsDto.emotionType = emotionTarget.emotion;
        peopleEmotionsDto.intensity =
          emotionTarget.emotion_intensity / emotionTarget.count;
        peopleDto.feel.push(peopleEmotionsDto);
      }

      peopleDto.name = target.target.name;
      peopleDto.count = target.target.count;
      result.people.push(peopleDto);
    }

    //diaryTodo => TodoResDto로 매핑 (응답 주고 받을 때 통일 형식)
    diary.diaryTodos.forEach((diaryTodo) => {
      const todoDto = new TodoAnalysisDto();

      todoDto.Todocontent = diaryTodo.content;
      result.todos.push(todoDto);
    });

    return result;
  }

  async deleteAll(memberId: string) {
    const member = await this.memberService.findOne(memberId);
    const diaries = await this.diaryRepository.find({
      where: { author: member },
    });
    for (const diary of diaries) {
      await this.diaryRepository.delete(diary.id);
    }
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
    nextCursor: { writtenDate: LocalDate; id: number } | null;
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

    const nextCursor: { writtenDate: LocalDate; id: number } | null = hasMore
      ? {
          writtenDate: items[items.length - 1].written_date,
          id: items[items.length - 1].id,
        }
      : null;

    return { items, hasMore, nextCursor };
  }
}
