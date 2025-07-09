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
import { ActivityAnalysis } from '../util/json.parser';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionType, getEmotionGroup } from '../enums/emotion-type.enum';
import { ClusteringResult } from '../util/cluster-json.parser';

@Injectable()
export class ActivityService {

  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityEmotion)
    private readonly activityEmotionRepo: Repository<ActivityEmotion>,
    private readonly clusterService: ClustersService,
    private readonly utilService: CommonUtilService,
  ) {}

  async createByDiary(activities: ActivityAnalysis[], diary: Diary) {
    for (const activity of activities) {
      const entity = new Activity();
      entity.diary = diary;
      entity.content = activity.activity;
      entity.strength = activity.strength ? activity.strength : null;

      let activityEntity = await this.repo.save(entity);

      let emotions = this.utilService.toCombinedEmotionTyped(
        activity.self_emotions
      );

      for (const e of emotions) {

        let emotion = this.utilService.parseEnumValue(
          EmotionType,
          e.emotion,
        );
        let entity: ActivityEmotion | null = await this.activityEmotionRepo.findOne({
          where: {
            activity: activityEntity,
            emotion,
          },
        });

        if (entity === null){
          entity = new ActivityEmotion();
          entity.activity = activityEntity;
          entity.emotion = emotion
          entity.emotionGroup = getEmotionGroup(entity.emotion);
          entity.intensitySum = e.intensity;
          entity.count = 1;
        } else {
          entity.intensitySum += e.intensity;
          entity.count += 1;
        }

        await this.activityEmotionRepo.save(entity);
      }
    }
  }

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

  async clusteringActivities(activities: Activity[]) {

    if (activities.length === 0) return [];

    const req = new MakeClusterDto();
    for (const activity of activities) {
      let dto = new SentenceDto();
      dto.text = activity.content;
      dto.id = activity.id;
      req.sentences.push(dto);
    }

    this.logger.log("req = " + req);

    const result = this.clusterService.getClusters(req);
    return result;
  }
}
