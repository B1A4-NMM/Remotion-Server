import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Between, Equal, In, LessThan, LessThanOrEqual, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { ConfigService } from '@nestjs/config';
import { EmotionService } from '../emotion/emotion.service';
import {
  DiaryHomeListRes,
  DiaryRes,
  EmotionRes,
} from './dto/diary-home-list.res';
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
import { WrittenDaysDto } from './dto/written-days.dto';
import { LocalDate } from 'js-joda';
import { MemberSummary } from '../entities/member-summary.entity';
import { SentenceParserService } from '../sentence-parser/sentence-parser.service';
import { TargetService } from '../target/target.service';
import { InfiniteScrollRes } from './dto/infinite-scroll.res';
import { SearchDiaryRes } from './dto/search-diary.res';
import { ActivityService } from '../activity/activity.service';
import { DiaryBookmarkListRes } from './dto/DiaryBookmarkListRes';
import { InfiniteBookmarkScrollRes } from './dto/infinite-bookmark-scroll.res';
import { DiaryDetailRes } from './dto/diary-detail.res';
import { MemberSummaryService } from '../member/member-summary.service';
import { EmotionScoreDto } from './dto/emotion-score.dto';
import { EmotionScoresResDto } from './dto/emotion-scores-res.dto';
import { RoutineService } from '../routine/routine.service';

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
    private readonly activityService: ActivityService,
    private readonly memberSummaryService: MemberSummaryService,
    private readonly configService: ConfigService,
    private readonly routineService: RoutineService,
  ) {}

  /**
   * 특정 연월에 작성된 일기의 날짜(day)들을 반환합니다.
   * @param memberId - 회원 ID
   * @param year - 연도
   * @param month - 월
   * @returns - 일기가 작성된 날짜(day) 배열
   */
  async getWrittenDays(
    memberId: string,
    year: number,
    month: number,
  ): Promise<WrittenDaysDto> {
    const startDate = LocalDate.of(year, month, 1);
    const endDate = startDate.plusMonths(1).minusDays(1);

    const diaries = await this.diaryRepository.find({
      where: {
        author: { id: memberId },
        written_date: Between(startDate, endDate),
      },
      select: ['written_date'],
    });

    const writtenDays = [...new Set(diaries.map((diary) => diary.written_date.dayOfMonth()))];

    return { writtenDays };
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

    const taggingPromise = this.analysisDiaryService.getTaggingContent(dto.content); // 시작만 하고 기다리진 않음

    const [result, routine] = await Promise.all([
      this.analysisDiaryService.analysisAndSaveDiary(
        memberId,
        dto,
        imageUrl,
        audioUrl,
      ),
      this.analysisDiaryService.analysisAndSaveDiaryRoutine(
        memberId,
        dto.content,
      ),
    ]);

    taggingPromise
      .then((tagging) => this.sentenceParserService.createByDiary(result, tagging))
      .catch((e) =>
        this.logger.error(`Tagging 백그라운드 처리 중 오류 발생: ${e.message}`),
      );

    this.logger.log(
      `생성 다이어리 { id : ${result.id}, author : ${result.author.nickname} }`,
    );

    this.logger.log(`일기의 주인 : ${result.author.id}, 글쓴이 : ${memberId}`);

    return result.id;
  }


  /**
   * 날짜와 기간을 받아 해당 날짜부터 그 이전의 기간까지의 멤버 요약을 가져옵니다
   */
  async findMemberSummaryByDateAndPeriod(
    memberId: string,
    diaryId: number,
    period: number,
  ) {
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId },
    });

    if (diary === null) {
      throw new NotFoundException(
        '[findMemberSummaryByDateAndPeriod] 일기를 찾지 못했습니다',
      );
    }

    const date = diary.written_date;

    const member = await this.memberService.findOne(memberId);
    const end = date.minusDays(period);
    const summary = await this.summaryRepo.find({
      where: { member: member, date: Between(end, date) },
      relations: ['emotionScores'],
    });

    return this.memberService.createMemberSummaryRes(summary, period);
  }

  /**
   * 일기를 삭제합니다. 일기의 주인이 아닐 경우 에러가 발생합니다
   */
  async deleteDiary(memberId: string, id: number) {
    const diary = await this.diaryRepository.findOne({
      where: { id: id },
    });

    if (diary === null) {
      throw new NotFoundException('[deleteDiary] 일기를 찾지 못했습니다');
    }

    if (diary.author.id != memberId) {
      throw new NotFoundException('해당 일기의 주인이 아닙니다');
    }

    await this.sentenceParserService.deleteAllByDiaryId(diary.id);
    return await this.diaryRepository.delete(diary.id);
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
  async getTodayDiariesRes(memberId: string): Promise<DiaryHomeRes> {
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
   * 해당 다이어리에 저장되어있는 json 본문을 포함한 정보를 반환합니다
   * @param memberId 멤버 ID
   * @param id 일기 ID
   * @param beforeDiaryCount 이전 일기 개수
   * @returns 일기 상세 정보 DTO
   */
  async getDiaryDetail(memberId: string, id: number, beforeDiaryCount: number) {

    this.logger.log(`memberId = ${memberId}, 일기 디테일 뷰 조회중 - 일기 id : ${id}`)

    const diary = await this.diaryRepository.findOne({
      where: { id: id },
    });

    if (diary === null) {
      throw new NotFoundException('없는 일기입니다');
    }

    if (diary.author.id != memberId) {
      throw new NotFoundException('해당 일기의 주인이 아닙니다');
    }

    // 멤버 정보 조회
    const member = await this.memberService.findOne(memberId);
    const today = LocalDate.now();

    // 경고 플래그 초기화 (기본값은 memberSummaryService에서 가져온 값)
    const warnings = await this.memberSummaryService.getMemberWarningsByPeriod(
      diary.written_date,
      memberId,
      7,
    );

    let diaryDetailRes = new DiaryDetailRes(diary);
    diaryDetailRes.anxietyWarning = warnings.anxietyWarning;
    diaryDetailRes.stressWarning = warnings.stressWarning;
    diaryDetailRes.depressionWarning = warnings.depressionWarning;

    // 스트레스 테스트 날짜 기반 경고 플래그 업데이트
    // STRESS_WARNING_PERIOD_DAYS 환경 변수에서 기간을 가져오고, 없으면 기본값 30일 사용
    const stressPeriod = this.configService.get<number>('WARNING_PERIOD_DAYS', 30);
    if (member.stress_test_date && (member.stress_test_date.plusDays(stressPeriod).isAfter(today) || member.stress_test_date.plusDays(stressPeriod).isEqual(today))) {
      diaryDetailRes.stressWarning = false;
    }

    // 불안 테스트 날짜 기반 경고 플래그 업데이트
    // ANXIETY_WARNING_PERIOD_DAYS 환경 변수에서 기간을 가져오고, 없으면 기본값 30일 사용
    const anxietyPeriod = this.configService.get<number>('WARNING_PERIOD_DAYS', 30);
    if (member.anxiety_test_date && (member.anxiety_test_date.plusDays(anxietyPeriod).isAfter(today) || member.anxiety_test_date.plusDays(anxietyPeriod).isEqual(today))) {
      diaryDetailRes.anxietyWarning = false;
    }

    // 우울 테스트 날짜 기반 경고 플래그 업데이트
    // DEPRESSION_WARNING_PERIOD_DAYS 환경 변수에서 기간을 가져오고, 없으면 기본값 30일 사용
    const depressionPeriod = this.configService.get<number>('WARNING_PERIOD_DAYS', 30);
    if (member.depression_test_date && (member.depression_test_date.plusDays(depressionPeriod).isAfter(today) || member.depression_test_date.plusDays(depressionPeriod).isEqual(today))) {
      diaryDetailRes.depressionWarning = false;
    }

    diaryDetailRes.beforeDiaryScores = await this.getEmotionScoresByDiary(
      diary.id,
      diary.written_date,
      beforeDiaryCount,
      memberId,
    );

    diaryDetailRes.recommendRoutine = await this.routineService.getRecommendRoutine(memberId, diary.id)

    return diaryDetailRes;
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
   * 커서를 통해 북마크된 일기들을 가져옴
   */
  async getBookmarkedDiariesInfinite(
    memberId: string,
    limit: number,
    cursor?: number,
  ) {
    const skip = cursor ? cursor * limit : 0;
    const take = limit + 1;

    const qb = this.diaryRepository
      .createQueryBuilder('d')
      .where('d.author_id = :memberId', { memberId })
      .andWhere('d.is_bookmarked = :isBookmarked', { isBookmarked: true })
      .orderBy('d.written_date', 'DESC')
      .addOrderBy('d.id', 'DESC')
      .skip(skip)
      .take(take);

    const rows = await qb.getMany();

    return await this.makeBookmarkScroll(rows, take, cursor);
  }

  /**
   * 커서를 통해 일기를 가져옴
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

    return await this.makeScroll(rows, take, cursor, memberId);
  }

  private async makeBookmarkScroll(
    rows: Diary[],
    take: number,
    cursor: number | undefined,
  ) {
    const { hasMore, nextCursor, diaryRes } = await this.getCursorAndRes(
      rows,
      take,
      cursor,
    );
    const items = new DiaryBookmarkListRes();
    items.diaries = diaryRes;
    items.totalDiaryCount = rows.length;

    return new InfiniteBookmarkScrollRes(items, hasMore, nextCursor);
  }

  private async makeScroll(
    rows: Diary[],
    take: number,
    cursor: number | undefined,
    memberId: string,
  ) {
    const { hasMore, nextCursor, diaryRes } = await this.getCursorAndRes(
      rows,
      take,
      cursor,
    );
    const items = new DiaryHomeListRes();
    items.diaries = diaryRes;
    items.continuousWritingDate = await this.getContinuousWritingDate(memberId);
    items.totalDiaryCount = await this.getWritingDiaryCount(memberId);
    items.emotionCountByMonth = await this.getEmotionsCountByMonth(memberId);

    return new InfiniteScrollRes(items, hasMore, nextCursor);
  }

  private async getCursorAndRes(
    rows: Diary[],
    take: number,
    cursor: number | undefined,
  ) {
    const hasMore = rows.length === take;
    const diaries = hasMore ? rows.slice(0, -1) : rows;

    const nextCursor: number | null = hasMore ? (cursor || 0) + 1 : null;

    const diaryRes = await Promise.all(
      diaries.map((diary) => this.createDiaryRes(diary)),
    );
    return { hasMore, nextCursor, diaryRes };
  }

  /**
   * 키워드를 통해 가장 유사한 문장을 가진 일기들을 반환합니다
   */
  /**
   * 키워드를 통해 가장 유사한 문장을 가진 일기들을 반환합니다
   * @param memberId 멤버 ID
   * @param keyword 검색 키워드
   */
  async getSearchDiary(
    memberId: string,
    keyword: string,
  ): Promise<SearchDiaryRes> {
    // 환경 변수에서 최소 검색어 길이를 가져오거나, 없으면 기본값 6을 사용합니다.
    const minLength = this.configService.get<number>(
      'SEARCH_KEYWORD_MIN_LENGTH',
      5,
    );

    const res = new SearchDiaryRes();
    let diaries: Diary[] = [];

    // 키워드 길이가 최소 길이보다 길면, 의미 기반의 벡터 검색을 수행합니다.
    if (keyword.length > minLength) {
      this.logger.log(`'${keyword}'에 대한 벡터 검색을 수행합니다.`);
      const searchResult =
        await this.sentenceParserService.searchSentenceByMember(
          keyword,
          memberId,
        );

      // 중복된 diaryId를 제거하기 위해 Set을 사용하고, 여러 ID를 한번에 조회합니다.
      const diaryIds = [...new Set(searchResult.map((v) => v.diary_id))];

      if (diaryIds.length > 0) {
        diaries = await this.diaryRepository.find({
          where: {
            id: In(diaryIds),
          },
          order: {
            written_date: 'DESC',
          },
        });

        // RDB에 존재하는 diary ID만 필터링합니다.
        const existingDiaryIds = new Set(diaries.map((d) => d.id));
        const deletedDiaryIds = diaryIds.filter(
          (id) => !existingDiaryIds.has(id),
        );

        // RDB에서 삭제되었지만 Qdrant에 남아있는 벡터 데이터를 비동기적으로 삭제합니다.
        if (deletedDiaryIds.length > 0) {
          this.logger.warn(
            `RDB와 정합성 깨짐!!, Qdrant에서 다음을 삭제합니다: ${deletedDiaryIds.join(', ')}`,
          );
          // 정합성을 맞추기 위한 작업이므로, 검색 결과 반환을 기다리게 하지 않습니다.
          deletedDiaryIds.forEach((id) =>
            this.sentenceParserService.deleteAllByDiaryId(id),
          );
        }
      }
    } else {
      // 키워드 길이가 짧으면, 내용에 키워드가 포함된 일기를 직접 검색합니다.
      this.logger.log(`'${keyword}'에 대한 내용 기반 검색을 수행합니다.`);
      diaries = await this.diaryRepository.find({
        where: {
          author: { id: memberId },
          // content 컬럼에서 키워드를 포함하는 일기를 찾습니다.
          content: Like(`%${keyword}%`),
        },
        order: {
          written_date: 'DESC', // 최신순으로 정렬합니다.
        },
      });
    }

    // 조회된 일기들을 DTO로 변환합니다.
    res.diaries = await Promise.all(
      diaries.map((diary) => this.createDiaryRes(diary)),
    );
    res.totalCount = res.diaries.length;

    return res;
  }

  /**
   * 다이어리의 북마크 여부를 토글합니다
   */
  async toggleDiaryBookmark(memberId: string, id: number) {
    let diary = await this.diaryRepository.findOne({
      where: {
        author: { id: memberId },
        id: id,
      },
    });

    if (diary === null) {
      throw new NotFoundException(
        '[toggleDiaryBookmark] 다이어리를 찾지 못했습니다',
      );
    }

    diary.is_bookmarked = !diary.is_bookmarked;
    diary = await this.diaryRepository.save(diary);
    return { id: diary.id, isBookmarked: diary.is_bookmarked };
  }

  /**
   * DiaryRes 객체를 만들어서 정보를 넣고 반환합니다
   */
  async createDiaryRes(diary: Diary) {
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
    diaryRes.activities =
      await this.activityService.getActivityContentsByDiary(diary);

    const emotions = await this.emotionService.findAllDiaryEmotions(diary);
    if (emotions.length > 0)
      diaryRes.emotions = emotions.map(
        (emotion) => new EmotionRes(emotion.emotion, emotion.intensity),
      );
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

  /**
   * diaryId를 인자로 받아, 연관된 diaryEmotion을 모두 불러와 감정 점수를 합산하여 반환합니다.
   * @param diaryId 일기 ID
   * @returns 일기 ID, 작성일, 감정 점수 합산
   */
  async getDiaryEmotionSumIntensity(diaryId: number) {
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId },
      relations: ['diaryEmotions'],
    });

    if (!diary) {
      throw new NotFoundException(`Diary with id ${diaryId} not found`);
    }

    const intensitySum = this.emotionService.getEmotionSumIntensity(
      diary.diaryEmotions,
    );

    return {
      diaryId: diary.id,
      writtenDate: diary.written_date,
      intensitySum,
    };
  }

  /**
   * LocalDate와 count를 인자로 받아, LocalDate보다 writtenDate가 같거나 작은 일기를
   * count개 만큼 불러와 writtenDate순으로 먼저 정렬하고, 이후에 id 순으로 정렬합니다.
   * 그 후 getDiaryEmotionSumIntensity에 정렬된 순서로 diaryId를 넘겨주면서 그 응답을 배열로 저장합니다.
   * 이후 그 응답을 DTO로 감싸서 반환합니다.
   * @param filterId
   * @param date 날짜
   * @param count 개수
   * @param memberId
   * @returns 감정 점수 DTO
   */
  async getEmotionScoresByDiary(
    filterId: number,
    date: LocalDate,
    count: number,
    memberId: string,
  ): Promise<EmotionScoresResDto> {
    const diaries = await this.diaryRepository.find({
      where: [
        {
          author: { id: memberId },
          written_date: LessThan(date),
        },
        {
          author: {id : memberId},
          written_date: Equal(date),
          id: LessThanOrEqual(filterId),
        },
      ],
      order: {
        written_date: 'DESC',
        id: 'DESC',
      },
      take: count,
    });

    const scores = await Promise.all(
      diaries.map(async (diary) => {
        const { intensitySum } = await this.getDiaryEmotionSumIntensity(
          diary.id,
        );
        return new EmotionScoreDto(diary.id, diary.written_date, intensitySum);
      }),
    );

    scores.sort((a, b) => {
      if (a.writtenDate.isBefore(b.writtenDate)) return 1;
      if (a.writtenDate.isAfter(b.writtenDate)) return -1;
      return b.diaryId - a.diaryId;
    });

    return new EmotionScoresResDto(scores);
  }
}
