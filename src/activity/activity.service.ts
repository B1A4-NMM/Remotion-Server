import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from '../entities/Activity.entity';
import { Repository } from 'typeorm';
import { DiaryAnalysisDto } from '../diary/dto/diary-analysis.dto';
import { Diary } from '../entities/Diary.entity';

@Injectable()
export class ActivityService {

  constructor(@InjectRepository(Activity) private readonly repo: Repository<Activity>,) {}

  async createByDiary(dto: DiaryAnalysisDto, diary: Diary) {

    
      for ( const activity of dto.activity ){

      const entity = new Activity();
      entity.diary = diary
      entity.content = activity.activityContent
      entity.strength = activity.strength ? activity.strength : null;

      await this.repo.save(entity)
    }
  
  }

}
