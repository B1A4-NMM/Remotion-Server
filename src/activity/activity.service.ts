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

@Injectable()
export class ActivityService {

  constructor(
    @InjectRepository(Activity) private readonly repo: Repository<Activity>,
    @InjectRepository(ActivityEmotion) private readonly emotionRepo: Repository<ActivityEmotion>,
    private readonly clusterService:ClustersService
    ) {}

  async createByDiary(dto: DiaryAnalysisDto, diary: Diary) {

      for ( const activity of dto.activity ){

      const entity = new Activity();
      entity.diary = diary
      entity.content = activity.activityContent
      entity.strength = activity.strength ? activity.strength : null;

      await this.repo.save(entity)
    }
  
  }

  async getActivitiesByPeriod(period: number, authorId: string) {

    const today = LocalDate.now()
    const start = today.minusDays(period)

    const activities = await this.repo
      .createQueryBuilder('activity')
      .leftJoin('activity.diary', 'diary')
      .leftJoinAndSelect('activity.emotions', 'emotions')       // 선택 사항
      .where('diary.author = :authorId', { authorId })
      .andWhere('diary.create_date BETWEEN :startDate AND :endDate', {
        startDate: start.toString(),
        endDate: today.toString(),
      })
      .getMany();

    return activities
  }

  async clusteringActivities(diaries:Diary[]) {

    let activities:Activity[] = []

    for (const diary of diaries) {
      activities.push(...diary.activities)
    }

    const req = new MakeClusterDto()
    for (const activity of activities) {
      let dto = new SentenceDto()
      dto.text = activity.content
      dto.id = activity.id
      req.sentences.push(dto)
    }

    const result = this.clusterService.getClusters(req)
    return result
  }

}
