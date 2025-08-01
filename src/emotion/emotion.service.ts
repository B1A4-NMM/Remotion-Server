import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { EmotionTarget } from '../entities/emotion-target.entity';
import { Target } from '../entities/Target.entity';
import {
  EmotionBase,
  EmotionGroup,
  EmotionGroupMap,
  EmotionType,
  isEmotionType,
} from '../enums/emotion-type.enum';
import {
  EmotionBaseAnalysisDto,
  EmotionBaseAnalysisResponseDto,
} from './dto/emotion-base-analysis.dto';
import {
  Emotions,
  EmotionSummaryWeekdayRes,
} from '../member/dto/emotion-summary-weekday.res';

import { CommonUtilService } from '../util/common-util.service';
import { DiaryEmotion } from '../entities/diary-emotion.entity';
import { Diary } from '../entities/Diary.entity';

import { weekday } from '../constants/weekday.constant';
import { ChronoUnit, LocalDate } from 'js-joda';
import { CombinedEmotion } from '../util/json.parser';
import { EmotionSummaryPeriodRes } from './dto/emotion-summary-period.res';
import { TargetEmotionSummaryRes } from './dto/target-emotion-summary.res';
import { ActivityService } from '../activity/activity.service';
import { ActivityEmotionSummaryRes } from './dto/activity-emotion-summary.res';
import { ClusteringResult } from '../util/cluster-json.parser';
import { Activity } from '../entities/Activity.entity';
import { EmotionAnalysisPeriodRes } from './dto/emotion-analysis-period.res';
import { ConfigService } from '@nestjs/config';

import { EmotionSummaryByTargetResponseDto } from './dto/emotion-summary-by-target.res.dto';

@Injectable()
export class EmotionService {
  private readonly logger = new Logger(EmotionService.name);

  constructor(
    @InjectRepository(EmotionTarget)
    private readonly emotionTargetRepository: Repository<EmotionTarget>,
    @InjectRepository(DiaryEmotion)
    private readonly diaryEmotionRepository: Repository<DiaryEmotion>,
    private readonly util: CommonUtilService,
    private readonly activityService: ActivityService,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    private readonly configService: ConfigService,
  ) {}

  async isDiaryEmpty(memberId:string) {
    const result = await this.diaryRepository.count(
      {
        where: {
          author: {id : memberId}
        }
      }
    );
    return {isEmpty : result === 0};
  }

  /**
   * Target ID를 기반으로 EmotionTarget 엔티티를 조회합니다.
   * @param targetId - 조회할 대상의 ID
   * @returns EmotionTarget 엔티티 배열
   */
  private async getEmotionTargetsByTargetId(
    targetId: number,
  ): Promise<EmotionTarget[]> {
    return this.emotionTargetRepository.find({
      where: { target: { id: targetId } },
      relations: ['target'],
    });
  }

  /**
   * EmotionTarget 엔티티 목록을 날짜별로 그룹화합니다.
   * @param emotionTargets - 그룹화할 EmotionTarget 엔티티 배열
   * @returns 날짜별로 그룹화된 EmotionTarget 맵
   */
  private groupEmotionTargetsByDate(
    emotionTargets: EmotionTarget[],
  ): Map<string, EmotionTarget[]> {
    const groupedByDate = new Map<string, EmotionTarget[]>();

    for (const emotionTarget of emotionTargets) {
      const feelDate =
        emotionTarget.feel_date?.toString() ?? LocalDate.now().toString();
      if (!groupedByDate.has(feelDate)) {
        groupedByDate.set(feelDate, []);
      }
      // @ts-ignore
      groupedByDate.get(feelDate).push(emotionTarget);
    }

    return groupedByDate;
  }

  /**
   * 특정 날짜의 EmotionTarget 목록을 감정별로 집계합니다.
   * @param emotionTargetsForDate - 특정 날짜의 EmotionTarget 엔티티 배열
   * @returns 감정별로 집계된 결과 배열
   */
  private aggregateEmotions(
    emotionTargetsForDate: EmotionTarget[],
  ): { emotion: EmotionType; count: number; intensity: number }[] {
    const emotionMap = new Map<
      EmotionType,
      { count: number; intensity: number }
    >();

    for (const { emotion, count, emotion_intensity } of emotionTargetsForDate) {
      if (!emotionMap.has(emotion)) {
        emotionMap.set(emotion, { count: 0, intensity: 0 });
      }
      const current = emotionMap.get(emotion);
      current!.count += count;
      current!.intensity += emotion_intensity;
    }

    return Array.from(emotionMap.entries()).map(
      ([emotion, { count, intensity }]) => ({
        emotion,
        count,
        intensity,
      }),
    );
  }

  /**
   * Target ID에 연관된 감정을 날짜별로 집계하여 반환합니다.
   * @param targetId - 대상의 ID
   * @returns 날짜별 감정 집계 결과
   */
  async getEmotionSummaryByTarget(
    targetId: number,
  ): Promise<EmotionSummaryByTargetResponseDto[]> {
    // 1. Target ID로 EmotionTarget 엔티티 조회
    const emotionTargets = await this.getEmotionTargetsByTargetId(targetId);

    if (!emotionTargets.length) {
      return [];
    }

    // 2. 날짜별로 EmotionTarget 그룹화
    const groupedByDate = this.groupEmotionTargetsByDate(emotionTargets);

    // 3. 날짜별로 감정 집계
    const result: EmotionSummaryByTargetResponseDto[] = [];
    for (const [date, targets] of groupedByDate.entries()) {
      const emotions = this.aggregateEmotions(targets);
      result.push({ date, emotions });
    }

    return result;
  }

  /**
   * 특정 대상과 관련된 모든 감정을 집계하여 반환합니다.
   * 날짜에 관계없이 각 감정 유형별로 총 강도와 발생 횟수를 합산합니다.
   * @param targetId - 대상의 ID
   * @returns 감정별 집계 결과 배열
   */
  async summarizeEmotionsByTarget(
    targetId: number,
  ): Promise<
    { emotion: EmotionType; totalIntensity: number; totalCount: number }[]
  > {
    const results = await this.emotionTargetRepository
      .createQueryBuilder('et')
      .select('et.emotion', 'emotion')
      .addSelect('SUM(et.emotion_intensity)', 'totalIntensity')
      .addSelect('SUM(et.count)', 'totalCount')
      .innerJoin('et.target', 't')
      .where('t.id = :targetId', { targetId })
      .groupBy('et.emotion')
      .orderBy('totalIntensity', 'DESC')
      .getRawMany<{
        emotion: EmotionType;
        totalIntensity: string;
        totalCount: string;
      }>();

    return results.map((row) => ({
      emotion: row.emotion,
      totalIntensity: parseFloat(row.totalIntensity),
      totalCount: parseInt(row.totalCount, 10),
    }));
  }

  /**
   * 기간을 인자로 받아 해당 기간 내에 받았던 대상별, 날짜별 긍정적인 감정들을 가져옵니다
   * @param memberId
   * @param period
   */
  async getPositiveEmotionsTargetAndSummary(memberId: string, period: number) {
    const positiveGroups = [
      EmotionGroup.안정,
      EmotionGroup.유대,
      EmotionGroup.활력,
    ];
    const [targetSummaries, dateSummaries] = await Promise.all([
      this.getTargetEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        positiveGroups,
      ),
      this.getEmotionSummaryPeriodByEmotionGroup(
        memberId,
        period,
        positiveGroups,
      ),
    ]);

    return {
      stabilityTarget: targetSummaries.filter(
        (t) => t.emotion === EmotionGroup.안정,
      ),
      bondTarget: targetSummaries.filter(
        (t) => t.emotion === EmotionGroup.유대,
      ),
      vitalityTarget: targetSummaries.filter(
        (t) => t.emotion === EmotionGroup.활력,
      ),
      stabilityDate: dateSummaries.filter(
        (s) => s.emotionGroup === EmotionGroup.안정,
      ),
      bondDate: dateSummaries.filter(
        (s) => s.emotionGroup === EmotionGroup.유대,
      ),
      vitalityDate: dateSummaries.filter(
        (s) => s.emotionGroup === EmotionGroup.활력,
      ),
    };
  }

  /**
   * 기간을 인자로 받아 해당 기간 내에 받았던 대상별, 날짜별 부정적인 감정들을 가져옵니다
   * @param memberId
   * @param period
   */
  async getNegativeEmotionsTargetAndSummary(memberId: string, period: number) {
    const negativeGroups = [
      EmotionGroup.우울,
      EmotionGroup.불안,
      EmotionGroup.스트레스,
    ];
    const [targetSummaries, dateSummaries] = await Promise.all([
      this.getTargetEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        negativeGroups,
      ),
      this.getEmotionSummaryPeriodByEmotionGroup(
        memberId,
        period,
        negativeGroups,
      ),
    ]);

    return {
      depressionTarget: targetSummaries.filter(
        (t) => t.emotion === EmotionGroup.우울,
      ),
      anxietyTarget: targetSummaries.filter(
        (t) => t.emotion === EmotionGroup.불안,
      ),
      stressTarget: targetSummaries.filter(
        (t) => t.emotion === EmotionGroup.스트레스,
      ),
      depressionDate: dateSummaries.filter(
        (s) => s.emotionGroup === EmotionGroup.우울,
      ),
      anxietyDate: dateSummaries.filter(
        (s) => s.emotionGroup === EmotionGroup.불안,
      ),
      stressDate: dateSummaries.filter(
        (s) => s.emotionGroup === EmotionGroup.스트레스,
      ),
    };
  }

  /**
   * 특정 기간 내에 부정적 감정이 들었던 행동들을 가져옵니다
   * @param memberId
   * @param period
   */
  async getNegativeActivities(memberId: string, period: number) {
    const [depression, anger, stress] = await Promise.all([
      this.getActivityEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        EmotionGroup.불안,
      ),
      this.getActivityEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        EmotionGroup.우울,
      ),
      this.getActivityEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        EmotionGroup.스트레스,
      ),
    ]);

    return {
      depression: depression,
      anger: anger,
      stress: stress,
    };
  }

  /**
   * 특정 기간 내에 긍정적 감정이 들었던 행동들을 가져옵니다
   * @param memberId
   * @param period
   */
  async getPositiveActivities(memberId: string, period: number) {
    const [stability, bond, vitality] = await Promise.all([
      this.getActivityEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        EmotionGroup.안정,
      ),
      this.getActivityEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        EmotionGroup.유대,
      ),
      this.getActivityEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        EmotionGroup.활력,
      ),
    ]);

    return {
      stability: stability,
      bond: bond,
      vitality: vitality,
    };
  }

  /**
   * 기간,멤버,감정 그룹을 인자로 받아 멤버와 연관된 해당 기간 내의 감정 그룹들을 반환합니다
   */
  async getEmotionAnalysis(
    memberId: string,
    period: number,
    emotion: EmotionGroup,
  ) {
    const res = new EmotionAnalysisPeriodRes();

    const [date, activities, people] = await Promise.all([
      this.getEmotionSummaryPeriodByEmotionGroup(memberId, period, [emotion]),
      this.getActivityEmotionSummaryByPeriodAndEmotionGroup(
        memberId,
        period,
        emotion,
      ),
      this.getTargetEmotionSummaryByPeriodAndEmotionGroup(memberId, period, [
        emotion,
      ]),
    ]);

    res.date = date;
    res.activities = activities;
    res.people = people;

    return res;
  }

  /**
   * 기간과 감정 그룹을 받아 해당 기간 내에 행동을 통해 받은 감정 그룹들을 합산하여 반환합니다. (성능 개선 버전)
   * @param memberId - 회원 ID
   * @param period - 조회 기간 (일)
   * @param emotionGroup - 조회할 감정 그룹
   * @returns 활동별 감정 요약 정보 배열
   */
  async getActivityEmotionSummaryByPeriodAndEmotionGroup(
    memberId: string,
    period: number,
    emotionGroup: EmotionGroup,
  ): Promise<ActivityEmotionSummaryRes[]> {
    const today = LocalDate.now();
    const pastDate = today.minusDays(period);

    // 1. 단일 DB 쿼리로 필요한 모든 데이터를 한번에 조회
    // Activity를 기준으로 Diary와 Emotions를 조인하여 필터링
    const allActivities = await this.activityRepository
      .createQueryBuilder('activity')
      .innerJoin('activity.diary', 'diary')
      .leftJoinAndSelect('activity.emotions', 'emotions') // 감정 정보도 함께 가져옴
      .where('diary.author_id = :memberId', { memberId })
      .andWhere('diary.written_date BETWEEN :startDate AND :endDate', {
        startDate: pastDate.toString(),
        endDate: today.toString(),
      })
      .getMany();

    if (allActivities.length === 0) {
      return [];
    }

    // 2. 외부 서비스 호출 (이 부분은 동일)
    const clusters: ClusteringResult =
      await this.activityService.clusteringActivities(allActivities);

    // 3. JS에서 데이터 가공 (DB 조회 없이 이미 로드된 데이터 활용)
    const activityMap = new Map(allActivities.map((a) => [a.id, a]));

    const result: ActivityEmotionSummaryRes[] = [];
    for (const cluster of clusters.clusters) {
      const res = new ActivityEmotionSummaryRes();
      res.activityContent = cluster.representative_sentence.text;
      res.activityId = cluster.representative_sentence.id;
      res.emotion = emotionGroup;
      res.totalIntensity = 0;
      res.count = 0;

      for (const sentence of cluster.sentences) {
        const activity = activityMap.get(sentence.id);
        if (!activity || !activity.emotions) continue; // emotions가 로드되었는지 확인

        for (const emotion of activity.emotions) {
          if (emotion.emotionGroup !== emotionGroup) continue;
          res.totalIntensity += emotion.intensitySum;
          res.count += emotion.count;
        }
      }

      const threshold = this.configService.get('ACTIVITY_THRESHOLD');
      if (res.count > 0 && res.totalIntensity > threshold) {
        result.push(res);
      }
    }

    // 4. 최종 결과 계산
    const total = result.reduce((sum, r) => sum + r.totalIntensity, 0);
    for (const r of result) {
      r.percentage =
        total > 0
          ? parseFloat(((r.totalIntensity / total) * 100).toFixed(1))
          : 0;
    }

    return result;
  }

  /**
   * 기간과 감정 그룹 배열을 받아 해당 기간 내에 등장한 인물들에게 느꼈던 감정 그룹들을 요약하여 반환합니다.
   * @param memberId - 회원 ID
   * @param period - 조회 기간 (일)
   * @param emotionGroups - 조회할 감정 그룹 배열
   * @returns 대상별 감정 요약 정보 배열
   */
  async getTargetEmotionSummaryByPeriodAndEmotionGroup(
    memberId: string,
    period: number,
    emotionGroups: EmotionGroup[],
  ): Promise<TargetEmotionSummaryRes[]> {
    const today = LocalDate.now();
    const pastDate = today.minusDays(period);
    const threshold = this.configService.get('TARGET_THRESHOLD') ?? 10;

    const emotionsInGroups = Object.entries(EmotionGroupMap)
      .filter(([, group]) => group && emotionGroups.includes(group))
      .map(([emotion]) => emotion as EmotionType);

    if (emotionsInGroups.length === 0) {
      return [];
    }

    const results = await this.emotionTargetRepository
      .createQueryBuilder('et')
      .select('t.id', 'targetId')
      .addSelect('t.name', 'targetName')
      .addSelect('et.emotion', 'emotionType') // 감정 타입을 가져와서 그룹을 식별
      .addSelect('SUM(et.emotion_intensity)', 'totalIntensity')
      .addSelect('SUM(et.count)', 'count')
      .innerJoin('et.target', 't')
      .innerJoin('t.diaryTargets', 'dt')
      .innerJoin('dt.diary', 'd')
      .where('d.author_id = :memberId', { memberId })
      .andWhere('d.written_date BETWEEN :startDate AND :endDate', {
        startDate: pastDate.toString(),
        endDate: today.toString(),
      })
      .andWhere('et.emotion IN (:...emotions)', { emotions: emotionsInGroups })
      .groupBy('t.id, t.name, et.emotion')
      .getRawMany();

    const summaryMap = new Map<string, TargetEmotionSummaryRes>();

    for (const row of results) {
      const emotionGroup = EmotionGroupMap[row.emotionType as EmotionType];
      if (!emotionGroup) continue;

      const key = `${row.targetId}-${emotionGroup}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          targetId: row.targetId,
          targetName: row.targetName,
          totalIntensity: 0,
          count: 0,
          emotion: emotionGroup,
        });
      }

      const summary = summaryMap.get(key)!;
      summary.totalIntensity += parseFloat(row.totalIntensity);
      summary.count += parseInt(row.count, 10);
    }

    const allSummaries = Array.from(summaryMap.values());

    // 각 그룹별로 상위 3개 필터링
    const finalResult: TargetEmotionSummaryRes[] = [];
    for (const group of emotionGroups) {
      const groupSummaries = allSummaries
        .filter((s) => s.emotion === group)
        .filter((s) => s.totalIntensity > threshold)
        .sort((a, b) => b.totalIntensity - a.totalIntensity)
        .slice(0, 3);
      finalResult.push(...groupSummaries);
    }

    return finalResult;
  }

  /**
   * 기간과 감정 그룹 배열을 받아 해당 기간 내의 그룹에 속하는 감정들의 요약 정보를 반환합니다.
   * @param memberId - 회원 ID
   * @param period - 조회 기간 (일)
   * @param emotionGroups - 조회할 감정 그룹 배열
   * @returns 감정 요약 정보 배열
   */
  async getEmotionSummaryPeriodByEmotionGroup(
    memberId: string,
    period: number,
    emotionGroups: EmotionGroup[],
  ): Promise<EmotionSummaryPeriodRes[]> {
    const today = LocalDate.now();
    const pastDate = today.minusDays(period);

    const emotionsInGroups = Object.entries(EmotionGroupMap)
      .filter(([, group]) => group && emotionGroups.includes(group))
      .map(([emotion]) => emotion as EmotionType);

    if (emotionsInGroups.length === 0) {
      return [];
    }

    const results = await this.diaryEmotionRepository
      .createQueryBuilder('diaryEmotion')
      .select("DATE_FORMAT(diary.written_date, '%Y-%m-%d')", 'date')
      .addSelect('diaryEmotion.emotion', 'emotionType') // 감정 타입을 가져와서 그룹을 식별
      .addSelect('SUM(diaryEmotion.intensity)', 'intensity')
      .addSelect('COUNT(diaryEmotion.id)', 'count')
      .innerJoin('diaryEmotion.diary', 'diary')
      .where('diary.author_id = :memberId', { memberId })
      .andWhere('diary.written_date BETWEEN :startDate AND :endDate', {
        startDate: pastDate.toString(),
        endDate: today.toString(),
      })
      .andWhere('diaryEmotion.emotion IN (:...emotions)', {
        emotions: emotionsInGroups,
      })
      .groupBy('diary.written_date, diaryEmotion.emotion')
      .orderBy('diary.written_date', 'ASC')
      .getRawMany();

    const summaryMap = new Map<string, EmotionSummaryPeriodRes>();

    for (const row of results) {
      const emotionGroup = EmotionGroupMap[row.emotionType as EmotionType];
      if (!emotionGroup) continue;

      const key = `${row.date}-${emotionGroup}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          date: LocalDate.parse(row.date),
          intensity: 0,
          count: 0,
          emotionGroup: emotionGroup,
        });
      }
      const summary = summaryMap.get(key)!;
      summary.intensity += parseFloat(row.intensity);
      summary.count += parseInt(row.count, 10);
    }

    return Array.from(summaryMap.values());
  }

  /**
   * 기간을 인자로 받아 해당 기간 내에 등장한 감정들이 어떤 요일에 등장했는지 반환
   */
  async getEmotionSummaryWeekDay(memberId: string, period: number) {
    const today = LocalDate.now();
    const pastDate = today.minusDays(period);

    const diaries = await this.diaryRepository.find({
      where: {
        author: { id: memberId },
        written_date: Between(pastDate, today),
      },
      relations: ['diaryEmotions'],
    });

    const res = new EmotionSummaryWeekdayRes();
    for (const diary of diaries) {
      const dayIndex = diary.written_date.dayOfWeek().value();
      const dayName = weekday[dayIndex] as keyof EmotionSummaryWeekdayRes;

      for (const diaryEmotion of diary.diaryEmotions) {
        const emotionType = diaryEmotion.emotion;
        const dayArray = res[dayName] as Emotions[];

        if (!dayArray) continue;

        const existingEmotion = dayArray.find((e) => e.emotion === emotionType);

        if (existingEmotion) {
          existingEmotion.count++;
        } else {
          dayArray.push({ emotion: emotionType, count: 1 });
        }
      }
    }
    return res;
  }

  /**
   * emotion-target 엔티티 생성 함수
   */
  async createOrUpdateEmotionTarget(
    target: Target,
    emotions: CombinedEmotion[],
    feelDate: LocalDate,
  ) {
    for (const dto of emotions) {
      const emotion = dto.emotion;
      const emotionIntensity = dto.intensity;
      let find = await this.findOneEmotionTarget(target, emotion);
      if (find === null) {
        find = new EmotionTarget(
          emotion,
          target,
          emotionIntensity,
          1,
          feelDate,
        );
      } else {
        find.emotion_intensity += emotionIntensity;
        find.count += 1;
      }

      await this.emotionTargetRepository.save(find);
    }
  }

  /**
   * diary-relation-emotion 엔티티 생성 함수
   */
  async createDiaryEmotionForTarget(emotions: CombinedEmotion[], diary: Diary) {
    return this.createDiaryEmotionByBase(emotions, diary, EmotionBase.Relation);
  }

  /**
   * diary-self-emotion 생성 함수
   */
  async createDiarySelfEmotion(emotions: CombinedEmotion[], diary: Diary) {
    return this.createDiaryEmotionByBase(emotions, diary, EmotionBase.Self);
  }

  /**
   * diary-state-emotion 생성 함수
   */
  async createDiaryStateEmotion(emotions: CombinedEmotion[], diary: Diary) {
    return this.createDiaryEmotionByBase(emotions, diary, EmotionBase.State);
  }

  /**
   * emotionBase에 따라 감정 생성
   */
  async createDiaryEmotionByBase(
    emotions: CombinedEmotion[],
    diary: Diary,
    emotionBase: EmotionBase,
  ) {
    for (const emotion of emotions) {
      let entity = await this.findOneDiaryEmotionByEmotionType(
        diary,
        emotion.emotion,
      );
      if (entity === null) {
        entity = new DiaryEmotion(
          diary,
          emotion.emotion,
          emotionBase,
          emotion.intensity,
        );
      } else {
        entity.intensity += emotion.intensity;
      }
      await this.diaryEmotionRepository.save(entity);
    }
  }

  /**
   * diary-emotion을 type에 따라 찾는 함수
   */
  findOneDiaryEmotionByEmotionType(diary: Diary, emotion: EmotionType) {
    if (!isEmotionType(emotion)) {
      throw new NotFoundException('emotion type is not valid');
    }
    return this.diaryEmotionRepository.findOne({
      where: {
        diary: { id: diary.id },
        emotion: emotion,
      },
    });
  }

  findAllDiaryEmotions(diary: Diary) {
    return this.diaryEmotionRepository.find({
      where: {
        diary: { id: diary.id },
      },
    });
  }

  /**
   * emotion-target 엔티티 찾는 함수
   */
  async findOneEmotionTarget(target: Target, emotion: EmotionType) {
    if (!isEmotionType(emotion)) {
      throw new NotFoundException('emotion type is not valid');
    }

    return await this.emotionTargetRepository.findOne({
      where: {
        target: { id: target.id },
        emotion,
      },
      relations: ['target'],
    });
  }

  /**
   * 날짜와 멤버 아이디를 받아 해당 멤버가 해당하는 날짜에 쓴 일기에서
   * 추출 된 감정들을 가져옵니다
   * 이 때, 감정들이 같을 경우, 감정의 intensity의 합을 가져옵니다.
   *
   *
   * 캘린더에서 이거 쓰면 될 듯
   */
  async sumIntensityByEmotionForDateAndOwner(date: string, ownerId: string) {
    return this.diaryEmotionRepository
      .createQueryBuilder('de')
      .select('de.emotion', 'emotion')
      .addSelect('SUM(de.intensity)', 'totalIntensity')
      .innerJoin('de.diary', 'd')
      .innerJoin('d.author', 'o')
      .where('d.written_date = :date', { date })
      .andWhere('o.id = :ownerId', { ownerId })
      .groupBy('de.emotion')
      .getRawMany<{
        emotion: EmotionType;
        totalIntensity: string;
      }>();
  }

  /**
   * 대상을 인자로 받아 대상에게 받은 감정들의 intensity의 합으로 순위를 매겨 limit개 만큼 가져옵니다
   */
  async topEmotionsToTarget(target: Target, limit: number) {
    const rows = await this.emotionTargetRepository
      .createQueryBuilder('et')
      .innerJoin('et.target', 't')
      .select('et.emotion', 'emotion')
      .addSelect('SUM(et.emotion_intensity)', 'totalIntensity')
      .where('t.id = :targetId', { targetId: target.id })
      .groupBy('et.emotion')
      .orderBy('totalIntensity', 'DESC')
      .limit(limit)
      .getRawMany<{ emotion: EmotionType; totalIntensity: string }>();

    return rows.map((row) => ({
      emotion: row.emotion as EmotionType,
      totalIntensity: Number(row.totalIntensity),
    }));
  }

  async topEmotionsToTargetSecond(target: Target) {
    const emotions = await this.topEmotionsToTarget(target, 2);
    return emotions;
  }

  /**
   * Target을 인자로 받아, 해당 Target의 감정 중 가장 큰 것 하나만 반환합니다
   */
  async highestEmotionToTarget(target: Target) {
    return await this.topEmotionsToTarget(target, 1)[0];
  }

  async getTodayEmotions(memberId: string) {
    const date = LocalDate.now();
    return this.getEmotionsByDate(memberId, date);
  }

  /**
   * 사용자의 특정 날짜에 대한 감정의 합산을 반환
   */
  async getEmotionsByDate(memberId: string, date: LocalDate) {
    const emotions = await this.sumIntensityByEmotionForDateAndOwner(
      date.toString(),
      memberId,
    );
    const result: any[] = [];
    for (const r of emotions) {
      result.push({
        emotion: r.emotion,
        intensity: parseFloat(r.totalIntensity),
      });
    }

    return result;
  }

  // 감정 추출하는 로직인데 특정 날짜의 추출 감정들중 intensity 가장 높은거
  async getRepresentEmotionByDiary(
    diaryId: number,
  ): Promise<EmotionType | null> {
    const diary = await this.diaryRepository.findOne({
      where: { id: diaryId },
      relations: ['diaryEmotions'],
    });

    if (!diary || !diary.diaryEmotions.length) return null;

    const sorted = diary.diaryEmotions.sort(
      (a, b) => b.intensity - a.intensity,
    );
    return sorted[0].emotion;
  }

  /**
   * 일기를 가장 처음 쓴 날부터 오늘까지의 감정을 요일별로 묶어서 반환합니다
   */
  async getAllEmotionsGroupByWeekday(memberId: string) {
    const endDate = LocalDate.now();
    let result = await this.diaryRepository
      .createQueryBuilder('d')
      .select('MIN(d.written_date)', 'minDate')
      .getRawOne();
    const rawMinDate = result?.minDate;

    const startDate = rawMinDate
      ? LocalDate.parse(new Date(rawMinDate).toISOString().substring(0, 10))
      : endDate;

    const period = ChronoUnit.DAYS.between(startDate, endDate);
    const EmotionGroupByWeekday = await this.getEmotionSummaryWeekDay(
      memberId,
      period,
    );

    return EmotionGroupByWeekday;
  }

  //특정 날짜 범위에 있는 모든 감정들 추출해서 보내주기
  //비동기,병렬 처리
  async getAllEmotionsGroupedByDateRange(
    userId: string,
    startDate: LocalDate,
    endDate: LocalDate,
  ) {
    const dates: LocalDate[] = [];
    let currentDate = startDate;

    //날짜 범위 내 모든 날짜 LocalDate로 저장
    while (currentDate.isBefore(endDate) || currentDate.isEqual(endDate)) {
      dates.push(currentDate);
      currentDate = currentDate.plusDays(1);
    }

    //병렬 처리로 모든 날짜에 대해 감정 데이터 조회
    const emotionPromises = dates.map(async (date) => {
      const emotions = await this.getEmotionsByDate(userId, date);

      return { date, emotions }; // 날짜별로 묶인 결과 반환
    });

    const results = await Promise.all(emotionPromises);

    return results;
  }

  //about-me에 보내줄 emotionBase에 따른 emotiontype 분석 로직
  async getEmotionBaseAnalysis(
    memberId: string,
  ): Promise<EmotionBaseAnalysisResponseDto> {
    //1.DB에서 집계 데이터를 한번에 조회
    const rawResult = await this.diaryEmotionRepository
      .createQueryBuilder('emotion')
      .select('emotion.emotionBase', 'emotionBase')
      .addSelect('emotion.emotion', 'emotion')
      .addSelect('SUM(emotion.intensity)', 'intensity')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('emotion.diary', 'diary')
      .where('diary.author_id = :memberId', { memberId })
      .groupBy('emotion.emotionBase')
      .addGroupBy('emotion.emotion')
      .getRawMany<{
        emotionBase: EmotionBase;
        emotion: EmotionType;
        intensity: string;
        count: string;
      }>();

    //2.초기화된 반환 DTO 구조
    const result: EmotionBaseAnalysisResponseDto = {
      Relation: [],
      Self: [],
      State: [],
    };

    //3.rawResult 순회하면서 해당 base에 맞는 배열에 값 push하기
    for (const row of rawResult) {
      const base = row.emotionBase as EmotionBase;
      const emotion = row.emotion as EmotionType;

      const dto: EmotionBaseAnalysisDto = {
        emotion,
        //db에서 string형으로 주기 때문에 float,int형으로 바꿔주기
        intensity: Math.round(parseFloat(row.intensity) * 1000) / 1000,
        count: parseInt(row.count),
      };

      result[base].push(dto);
    }

    return result;
  }

  /**
   * 년, 월을 인자로 받아 해당 월의 감정 Base 기반 분석을 수행합니다.
   * @param memberId 회원 ID
   * @param year 연도
   * @param month 월
   */
  async getEmotionBaseAnalysisByMonth(
    memberId: string,
    year: number,
    month: number,
  ) {
    const startDate = LocalDate.of(year, month, 1);
    const endDate = startDate.plusMonths(1).minusDays(1);

    return this.getEmotionBaseAnalysisByPeriod(memberId, startDate, endDate);
  }

  /**
   * 기간을 인자로 받아 해당 기간의 감정 Base 기반 분석을 수행합니다.
   * @param memberId 회원 ID
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns 감정 Base 분석 결과
   */
  async getEmotionBaseAnalysisByPeriod(
    memberId: string,
    startDate: LocalDate,
    endDate: LocalDate,
  ): Promise<EmotionBaseAnalysisResponseDto> {
    // 1. DB에서 기간 내의 집계 데이터를 한번에 조회
    const rawResult = await this.diaryEmotionRepository
      .createQueryBuilder('emotion')
      .select('emotion.emotionBase', 'emotionBase')
      .addSelect('emotion.emotion', 'emotion')
      .addSelect('SUM(emotion.intensity)', 'intensity')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('emotion.diary', 'diary')
      .where('diary.author_id = :memberId', { memberId })
      .andWhere('diary.written_date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toString(),
        endDate: endDate.toString(),
      })
      .groupBy('emotion.emotionBase')
      .addGroupBy('emotion.emotion')
      .getRawMany<{
        emotionBase: EmotionBase;
        emotion: EmotionType;
        intensity: string;
        count: string;
      }>();

    // 2. 초기화된 반환 DTO 구조
    const result: EmotionBaseAnalysisResponseDto = {
      Relation: [],
      Self: [],
      State: [],
    };

    // 3. rawResult 순회하면서 해당 base에 맞는 배열에 값 push하기
    for (const row of rawResult) {
      const base = row.emotionBase as EmotionBase;
      const emotion = row.emotion as EmotionType;

      const dto: EmotionBaseAnalysisDto = {
        emotion,
        // db에서 string형으로 주기 때문에 float,int형으로 바꿔주기
        intensity: Math.round(parseFloat(row.intensity) * 1000) / 1000,
        count: parseInt(row.count),
      };

      result[base].push(dto);
    }

    return result;
  }

  /**
   * 일기를 받아 해당 일기의 대표 감정 그룹을 반환합니다.
   * @returns 가장 높은 감정 그룹
   * @param diaryId
   */
  async getRepresentEmotionGroup(
    diaryId: number,
  ): Promise<EmotionGroup | null> {
    // 1. diary에 연결된 모든 diaryEmotion을 조회합니다.
    const diaryEmotions = await this.diaryEmotionRepository.find({
      where: { diary: { id: diaryId } },
    });

    if (!diaryEmotions.length) {
      return null;
    }

    // 2. 조회된 diaryEmotion의 EmotionType들을 EmotionGroup으로 그룹핑합니다.
    const emotionGroupCounts: Record<string, number> = {};
    for (const diaryEmotion of diaryEmotions) {
      const emotionGroup = EmotionGroupMap[diaryEmotion.emotion];
      if (emotionGroup) {
        emotionGroupCounts[emotionGroup] =
          (emotionGroupCounts[emotionGroup] || 0) + 1;
      }
    }

    // 3. 그룹핑된 EmotionGroup 중 가장 높은 감정 그룹을 반환합니다.
    let representEmotionGroup: EmotionGroup | null = null;
    let maxCount = 0;

    for (const [group, count] of Object.entries(emotionGroupCounts)) {
      if (count > maxCount) {
        maxCount = count;
        representEmotionGroup = group as EmotionGroup;
      }
    }

    return representEmotionGroup;
  }

  /**
   * 감정 배열을 받아 그룹별로 점수를 합산합니다.
   * '무난' 감정은 제외하고, [우울, 불안, 스트레스] 그룹은 점수를 감산합니다.
   * @param emotions 감정 배열
   * @returns 감정 점수 합산
   */
  getEmotionSumIntensity(
    emotions: { emotion: EmotionType; intensity: number }[],
  ): number {
    const negativeGroups = [
      EmotionGroup.우울,
      EmotionGroup.불안,
      EmotionGroup.스트레스,
    ];

    return emotions
      .filter((e) => e.emotion !== EmotionType.무난)
      .reduce((acc, { emotion, intensity }) => {
        const group = EmotionGroupMap[emotion];
        if (group && negativeGroups.includes(group)) {
          return acc - intensity / 2;
        }
        return acc + intensity / 2;
      }, 0);
  }
}
