import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityEmotion)
    private readonly emotionRepo: Repository<ActivityEmotion>,
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
        let entity: ActivityEmotion | null = await this.emotionRepo.findOne({
          where: {
            activity: activityEntity,
            emotion,
          },
        });

        if (entity === null){
          entity = new ActivityEmotion();
          entity.activity = activityEntity;
          entity.emotion = emotion
          entity.emotionBase = getEmotionGroup(entity.emotion);
          entity.intensitySum = e.intensity;
          entity.count = 1;
        } else {
          entity.intensitySum += e.intensity;
          entity.count += 1;
        }

        await this.emotionRepo.save(entity);
      }
    }
  }

  async getActivitiesByPeriod(period: number, authorId: string) {
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

    return activities;
  }

  async clusteringActivities(diaries: Diary[]) {
    let activities: Activity[] = [];

    for (const diary of diaries) {
      activities.push(...diary.activities);
    }

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
}
