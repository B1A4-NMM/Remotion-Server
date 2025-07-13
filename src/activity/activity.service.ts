import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from '../entities/Activity.entity';
import { Repository } from 'typeorm';
import { DiaryAnalysisDto } from '../diary/dto/diary-analysis.dto';
import { Diary } from '../entities/Diary.entity';
import { ClustersService } from '../vector/clusters.service';
import { MakeClusterDto, SentenceDto } from '../vector/dto/make-cluster.dto';
import { LocalDate } from 'js-joda';
import { ActivityEmotion } from '../entities/activity-emotion.entity';
import { ActivityAnalysis, CombinedEmotion } from '../util/json.parser';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionType, getEmotionGroup } from '../enums/emotion-type.enum';
import { ClusteringResult } from '../util/cluster-json.parser';
import { SimsceEmbedderService } from '../vector/simsce-embedder.service';
import { ActivityClusterService } from '../activity-cluster/activity-cluster.service';

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

      let emotions: CombinedEmotion[] = [];
      this.aggregateEmotions(activity, emotions);

      for (const e of emotions) {
        await this.saveOrUpdateActivityEmotion(e, activityEntity);
      }
    }
  }

  private aggregateEmotions(
    activity: ActivityAnalysis,
    emotions: CombinedEmotion[],
  ) {
    const self = this.utilService.toCombinedEmotionTyped(
      activity.self_emotions,
    );
    const state = this.utilService.toCombinedEmotionTyped(
      activity.state_emotions,
    );

    emotions.push(...self);
    emotions.push(...state);
  }

  /**
   * activityEmotion을 업데이트하거나 생성합니다
   * 해당 액티비티에 같은 감정이 있으면 "같다"라고 간주하고 업데이트합니다
   */
  private async saveOrUpdateActivityEmotion(
    e: CombinedEmotion,
    activityEntity: Activity,
  ) {
    let emotion = this.utilService.parseEnumValue(EmotionType, e.emotion);
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
      entity.count = 1;
    } else {
      // 이미 존재한다면 intensity와 카운트의 증가
      entity.intensitySum += e.intensity;
      entity.count += 1;
    }

    await this.activityEmotionRepo.save(entity);
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
  async getActivityContentsByDiary(diary:Diary) {
    const activities = await this.repo.find({
      where: { diary: {id : diary.id} },
      select: ['content']
    })
    return activities.map(activity => activity.content)
  }

}
