import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { EmotionService } from '../emotion/emotion.service';
import { DiaryHomeListRes, DiaryRes } from './dto/diary-home-list.res';
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
import { TargetService } from '../target/target.service';
import { Member } from '../entities/Member.entity';
import { InfiniteScrollRes } from './dto/infinite-scroll.res';
import { SearchDiaryRes } from './dto/search-diary.res';

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
    private readonly targetService: TargetService,
  ) {}

  async findMemberSummaryByDateAndPeriod(
    memberId: string,
    diaryId: number,
    period: number,
  ) {
    const diary = await this.diaryRepository.findOneOrFail({
      where: { id: diaryId },
    });
    const date = diary.written_date;

    const member = await this.memberService.findOne(memberId);
    const end = date.minusDays(period);
    const summary = await this.summaryRepo.find({
      where: { member: member, date: Between(end, date) },
      relations: ['emotionScores'],
    });

    return this.memberService.createMemberSummaryRes(summary, period);
  }

  async deleteDiary(memberId: string, id: number) {
    const diary = await this.diaryRepository.findOneOrFail({
      where: { id: id },
    });

    if (diary.author.id != memberId) {
      throw new NotFoundException('해당 일기의 주인이 아닙니다');
    }

    await this.sentenceParserService.deleteAllByDiaryId(diary.id);
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
    imageUrl?: string[] | null,
    audioUrl?: string | null,
  ) {
    this.logger.log('다이어리 생성');
    const result = await this.analysisDiaryService.analysisAndSaveDiary(
      memberId,
      dto,
      imageUrl,
      audioUrl,
    );
    await this.analysisDiaryService.analysisAndSaveDiaryRoutine(
      memberId,
      dto.content,
    );

    this.logger.log(
      `생성 다이어리 { id : ${result.id}, author : ${result.author.nickname} }`,
    );

    this.logger.log(`일기의 주인 : ${result.author.id}, 글쓴이 : ${memberId}`);

    return result.id;
  }

  /**
   * 멤버 아이디와 날짜를 받아 해당되는 다이어리 하나를 반환합니다
   */
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
    const emotions = await this.emotionService.getEmotionsByDate(
      memberId,
      date,
    );
    const result = new DiaryHomeRes();
    result.todayDiaries = diaries.diaries;
    result.todayEmotions = emotions;
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
    const res: DiaryHomeListRes = new DiaryHomeListRes();
    for (const diary of diaries) {
      let diaryRes = new DiaryRes();
      diaryRes.diaryId = diary.id;
      diaryRes.title = diary.title;
      diaryRes.writtenDate = diary.written_date;
      diaryRes.content = diary.content;

      for (const emotion of diary.diaryEmotions) {
        // @ts-ignore
        if (!diaryRes.emotions.includes(emotion.emotion)) {
          // 중복 방지
          // @ts-ignore
          diaryRes.emotions.push(emotion.emotion);
        }
      }

      for (const target of diary.diaryTargets) {
        // @ts-ignore
        diaryRes.targets.push(target.target.name);
      }

      res.diaries.push(diaryRes);
    }
    return res;
  }

  /**
   * 해당 다이어리에 저장되어있는 json 본문을 반환합니다
   */
  async getDiaryJson(memberId: string, id: number) {
    const diary = await this.diaryRepository.findOneOrFail({
      where: { id: id },
    });

    if (diary.author.id != memberId) {
      throw new NotFoundException('해당 일기의 주인이 아닙니다');
    }

    return diary.metadata;
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

  /**
   * 이 멤버의 모든 다이어리를 삭제합니다
   */
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
  async getDiariesInfinite(memberId: string, limit: number, cursor?: number) {
    const skip = cursor ? cursor * limit : 0;
    const take = limit + 1; // Check for more items

    const qb = this.diaryRepository
      .createQueryBuilder('d')
      .where('d.author_id = :memberId', { memberId })
      .orderBy('d.written_date', 'DESC')
      .addOrderBy('d.id', 'DESC')
      .skip(skip)
      .take(take);

    const rows = await qb.getMany();

    const hasMore = rows.length === take;
    const diaries = hasMore ? rows.slice(0, -1) : rows;

    const nextCursor: number | null = hasMore ? (cursor || 0) + 1 : null;

    const diaryRes = await Promise.all(
      diaries.map((diary) => this.createDiaryHomeRes(diary)),
    );
    const items = new DiaryHomeListRes();
    items.diaries = diaryRes;
    items.continuousWritingDate = await this.getContinuousWritingDate(memberId);
    items.totalDiaryCount = await this.getWritingDiaryCount(memberId);
    items.emotionCountByMonth = await this.getEmotionsCountByMonth(memberId);

    return new InfiniteScrollRes(items, hasMore, nextCursor);
  }

  /**
   * 키워드를 통해 가장 유사한 문장을 가진 일기들을 반환합니다
   */
  async getSearchDiary(memberId: string, keyword: string) {
    const result = await this.sentenceParserService.searchSentenceByMember(
      keyword,
      memberId,
    );
    const length = result.length;
    let res = new SearchDiaryRes();
    res.totalCount = length;

    for (const vector of result) {
      const diaryId = vector.payload.diary_id;
      const diary = await this.diaryRepository.findOne({
        where: {
          id: diaryId,
        },
      });
      if (!diary) {
        this.logger.log('getSearchDiary : diary not found');
        throw new NotFoundException('일기를 찾을 수 없습니다');
      }
      const dto = await this.createDiaryHomeRes(diary);
      res.diaries.push(dto);
    }

    return res;
  }

  /**
   * DiaryRes 객체를 만들어서 정보를 넣고 반환합니다
   */
  private async createDiaryHomeRes(diary: Diary) {
    let diaryRes = new DiaryRes();
    diaryRes.diaryId = diary.id;
    diaryRes.title = diary.title;
    diaryRes.writtenDate = diary.written_date;
    diaryRes.content = diary.content;
    diaryRes.audioPath = diary.audio_path;
    diaryRes.photoPath = diary.photo_path;
    diaryRes.isBookmarked = diary.is_bookmarked;
    diaryRes.latitude = diary.latitude;
    diaryRes.longitude = diary.longitude;

    const emotions = await this.emotionService.findAllDiaryEmotions(diary);
    if (emotions.length > 0)
      diaryRes.emotions = emotions.map((emotion) => emotion.emotion);
    else diaryRes.emotions = [];

    const targets = await this.targetService.getTargetByDiary(diary);
    if (targets.length > 0)
      diaryRes.targets = targets.map((target) => target.name);
    else diaryRes.targets = [];

    return diaryRes;
  }

  /**
   * 어제까지 연속적으로 일기를 써온 날의 수를 집계하여 반환합니다
   */
  private async getContinuousWritingDate(memberId: string) {
    const today = LocalDate.now();
    let count = 0;
    let findDate = today.minusDays(1);
    let exists = await this.diaryRepository.findOne({
      where: {
        author: { id: memberId },
        written_date: findDate,
      },
      select: ['id'],
    });

    while (exists) {
      count++;
      findDate = findDate.minusDays(1);
      exists = await this.diaryRepository.findOne({
        where: {
          author: { id: memberId },
          written_date: findDate,
        },
        select: ['id'],
      });
    }

    return count;
  }

  /**
   * 멤버가 이때까지 써온 일기의 갯수를 집계하여 반환합니다
   */
  private async getWritingDiaryCount(memberId: string) {
    const ids = await this.diaryRepository.find({
      where: {
        author: { id: memberId },
      },
      select: ['id'],
    });

    return ids.length;
  }

  /**
   * 이 달에 받은 감정들의 갯수를 집계하여 반환합니다
   */
  private async getEmotionsCountByMonth(memberId: string) {
    const today = LocalDate.now();
    const startDate = today.withDayOfMonth(1);
    const result = await this.emotionService.getAllEmotionsGroupedByDateRange(
      memberId,
      startDate,
      today,
    );

    const allEmotions: string[] = [];
    result.forEach((dayData) => {
      dayData.emotions.forEach((emotion) => {
        allEmotions.push(emotion.emotion);
      });
    });

    const uniqueEmotions = new Set(allEmotions);
    return uniqueEmotions.size;
  }
}
