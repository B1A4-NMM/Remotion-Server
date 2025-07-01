import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from '../entities/Activity.entity';
import { Repository } from 'typeorm';
import { DiaryAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { Diary } from '../entities/Diary.entity';

@Injectable()
export class ActivityService {

  constructor(@InjectRepository(Activity) private readonly repo: Repository<Activity>,) {}

  async createByDiary(dto: DiaryAnalysisDto, diary: Diary) {

    dto.activity.forEach(activity => {
      let entity = new Activity();
      entity.diary = diary
      entity.content = activity.activityContent
      entity.strength = activity.strength ? activity.strength : null
      entity.weakness = activity.weakness ? activity.weakness : null
      this.repo.save(entity)
    })

  }

}
