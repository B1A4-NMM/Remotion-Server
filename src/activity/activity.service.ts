import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from '../entities/Activity.entity';
import { Repository } from 'typeorm';
import { Diary } from '../entities/Diary.entity';
import { ClustersService } from '../vector/clusters.service';
import { MakeClusterDto, SentenceDto } from '../vector/dto/make-cluster.dto';
import { LocalDate } from 'js-joda';
import { ActivityEmotion } from '../entities/activity-emotion.entity';
import { ActivityAnalysis, CombinedEmotion } from '../util/json.parser';
import { CommonUtilService } from '../util/common-util.service';
import {
  EmotionBase,
  EmotionGroup,
  EmotionType,
  getEmotionBase,
  getEmotionGroup,
} from '../enums/emotion-type.enum';
import { ClusteringResult } from '../util/cluster-json.parser';
import { SimsceEmbedderService } from '../vector/simsce-embedder.service';
import { ActivityClusterService } from '../activity-cluster/activity-cluster.service';
import { ActivityTarget } from '../entities/ActivityTarget.entity';
import { TargetService } from '../target/target.service';
import { Target } from '../entities/Target.entity';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityEmotion)
    private readonly activityEmotionRepo: Repository<ActivityEmotion>,
    private readonly clusterService: ClustersService,
    private readonly utilService: CommonUtilService,
    private readonly embedder: SimsceEmbedderService,
    private readonly activityClusterService: ActivityClusterService,
    @InjectRepository(ActivityTarget)
    private readonly activityTargetRepo: Repository<ActivityTarget>,
    @InjectRepository(Target)
    private readonly targetRepo: Repository<Target>,
  ) {}

  /**
   * 분석된 일기를 가지고 행동을 저장합니다.
   * 행동을 먼저 저장한 후, 행동 클러스터와 행동 감정을 같이 저장합니다
   */
  async createByDiary(activities: ActivityAnalysis[], diary: Diary) {
    for (const activity of activities) {
      const entity = new Activity();
      entity.diary = diary;
      entity.content = activity.activity;
      entity.strength = activity.strength ? activity.strength : null;
      entity.vector = await this.embedder.embed(activity.activity);
      entity.date = diary.written_date;

      let activityEntity = await this.repo.save(entity);

      await this.activityClusterService.createByActivity(
        activityEntity,
        diary,
        diary.author,
      ); // 유저의 모든 활동에 대한 클러스터

      let selfEmotions: CombinedEmotion[] = [];
      let stateEmotions: CombinedEmotion[] = [];
      this.aggregateEmotions(activity, selfEmotions, stateEmotions);

      for (const e of selfEmotions) {
        await this.saveOrUpdateActivityEmotion(
          e,
          activityEntity,
          EmotionBase.State,
        );
      }

      for (const e of stateEmotions) {
        await this.saveOrUpdateActivityEmotion(
          e,
          activityEntity,
          EmotionBase.State,
        );
      }

      for (const person of activity.peoples){
        const target = await this.targetRepo.findOne({
          where: {
            name: person.name,
            member: {id : diary.author.id}
          }
        })
        if (!target){
          this.logger.warn(`target not found. person: ${person.name}, diary: ${diary.id}`)
          continue
        }
        let activityTarget = new ActivityTarget();
        activityTarget.activity = activityEntity
        activityTarget.target = target
        await this.activityTargetRepo.save(activityTarget)
      }
    }
  }

  private aggregateEmotions(
    activity: ActivityAnalysis,
    selfEmotions: CombinedEmotion[],
    stateEmotions: CombinedEmotion[],
  ) {
    const self = this.utilService.toCombinedEmotionTyped(
      activity.self_emotions,
    );
    const state = this.utilService.toCombinedEmotionTyped(
      activity.state_emotions,
    );

    selfEmotions.push(...self);
    stateEmotions.push(...state);
  }

  /**
   * activityEmotion을 업데이트하거나 생성합니다
   * 해당 액티비티에 같은 감정이 있으면 "같다"라고 간주하고 업데이트합니다
   */
  private async saveOrUpdateActivityEmotion(
    e: CombinedEmotion,
    activityEntity: Activity,
    emotionBase: EmotionBase,
  ) {
    let emotion = this.utilService.parseEnumValue(EmotionType, e.emotion);
    if (emotion === null) {
      return
    }
    let entity: ActivityEmotion | null = await this.activityEmotionRepo.findOne(
      {
        where: {
          activity: { id: activityEntity.id },
          emotion,
        },
      },
    );

    if (entity === null) {
      // 이 행동에 대한 특정 감정이 없다면 새로 만들기
      entity = new ActivityEmotion();
      entity.activity = activityEntity;
      entity.emotion = emotion;
      entity.emotionGroup = getEmotionGroup(entity.emotion);
      entity.intensitySum = e.intensity;
      entity.emotionBase = emotionBase;
      entity.count = 1;
    } else {
      // 이미 존재한다면 intensity와 카운트의 증가
      entity.intensitySum += e.intensity;
      entity.count += 1;
    }

    try {
      await this.activityEmotionRepo.save(entity);
    } catch (e) {
      if (e.code === 'ER_NO_REFERENCED_ROW_2') {
        this.logger.warn(
          `ActivityEmotion 저장 실패: Activity가 존재하지 않습니다. (Activity ID: ${activityEntity.id})`,
        );
      } else {
        throw e;
      }
    }
  }

  /**
   * 특정 기간 내의 액티비티의 클러스터들을 반환합니다
   * ActivityCluster 와는 다름 !!
   */
  async getActivityClusterByPeriod(period: number, authorId: string) {
    const today = LocalDate.now();
    const start = today.minusDays(period);

    const activities = await this.repo
      .createQueryBuilder('activity')
      .leftJoin('activity.diary', 'diary')
      .leftJoinAndSelect('activity.emotions', 'emotions') // 선택 사항
      .where('diary.author = :authorId', { authorId })
      .andWhere('diary.create_date BETWEEN :startDate AND :endDate', {
        startDate: start.toString(),
        endDate: today.toString(),
      })
      .getMany();

    if (activities.length === 0) return [];

    let result = await this.clusteringActivities(activities);
    const parseResult: ClusteringResult = JSON.parse(JSON.stringify(result));

    return parseResult;
  }

  /**
   * 인자로 받은 액티비티들을 클러스화합니다
   */
  async clusteringActivities(activities: Activity[]) {
    if (activities.length === 0) return [];

    const req = new MakeClusterDto();
    for (const activity of activities) {
      let dto = new SentenceDto();
      dto.text = activity.content;
      dto.id = activity.id;
      req.sentences.push(dto);
    }

    const result = this.clusterService.getClusters(req);
    return result;
  }

  /**
   * 일기 하나를 인자로 받아 연관된 행동들을 string으로 반환합니다
   */
  async getActivityContentsByDiary(diary: Diary) {
    const activities = await this.repo.find({
      where: { diary: { id: diary.id } },
      select: ['content'],
    });
    return activities.map((activity) => activity.content);
  }

  /**
   * 특정 멤버의 모든 활동을 조회합니다.
   * @param memberId - 멤버의 ID
   * @returns 해당 멤버의 모든 활동 배열
   */
  private async getActivitiesByMember(memberId: string): Promise<Activity[]> {
    return this.repo
      .createQueryBuilder('activity')
      .innerJoin('activity.diary', 'diary')
      .innerJoin('diary.author', 'author')
      .where('author.id = :memberId', { memberId })
      .leftJoinAndSelect('activity.emotions', 'emotions')
      .getMany();
  }

  /**
   * 활동 배열을 필터링하여 특정 감정 그룹과 관련된 활동만 반환합니다.
   * @param activities - 필터링할 활동 배열
   * @param emotionGroup - 필터링할 감정 그룹
   * @returns 필터링된 활동 배열
   */
  private filterActivitiesByEmotionGroup(
    activities: Activity[],
    emotionGroup: EmotionGroup,
  ): Activity[] {
    return activities.filter((activity) =>
      activity.emotions.some((emotion) => {
        const base = getEmotionBase(emotion.emotion);
        return (
          (base === EmotionBase.State || base === EmotionBase.Self) &&
          emotion.emotionGroup === emotionGroup
        );
      }),
    );
  }

  /**
   * 활동 배열을 필터링하여 감정 강도가 임계값 이상인 활동만 반환합니다.
   * @param activities - 필터링할 활동 배열
   * @param threshold - 감정 강도 임계값
   * @returns 필터링된 활동 배열
   */
  private filterActivitiesByIntensity(
    activities: Activity[],
    threshold: number,
  ): Activity[] {
    return activities.filter((activity) =>
      activity.emotions.some((emotion) => emotion.intensitySum >= threshold),
    );
  }

  /**
   * 특정 감정 그룹 및 강도 임계값에 따라 활동을 조회합니다.
   * @param memberId - 멤버의 ID
   * @param emotionGroup - 조회할 감정 그룹
   * @param intensityThreshold - 감정 강도 임계값
   * @returns 조건에 맞는 활동의 ID와 내용 배열
   */
  async getActivitiesByEmotionGroup(
    memberId: string,
    emotionGroup: EmotionGroup,
    intensityThreshold: number,
  ): Promise<{ id: number; content: string }[]> {
    // 1. 해당 멤버의 모든 활동을 가져옵니다.
    const allActivities = await this.getActivitiesByMember(memberId);

    // 2. EmotionBase가 State 또는 Self이고, EmotionGroup이 일치하는 활동만 필터링합니다.
    const groupFilteredActivities = this.filterActivitiesByEmotionGroup(
      allActivities,
      emotionGroup,
    );

    // 3. 감정 강도가 임계값 이상인 활동만 필터링합니다.
    const intensityFilteredActivities = this.filterActivitiesByIntensity(
      groupFilteredActivities,
      intensityThreshold,
    );

    // 4. 필터링된 활동의 id와 content만 반환합니다.
    return intensityFilteredActivities.map((activity) => ({
      id: activity.id,
      content: activity.content,
    }));
  }
}
