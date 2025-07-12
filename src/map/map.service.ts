import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Diary } from '../entities/Diary.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { DiaryMapInfo, DiaryMapRes } from './dto/diary-map.res';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(Diary)
    private readonly diaryRepo: Repository<Diary>,
  ) {}

  async findAllDiaryForMap(memberId: string) {
    const result = await this.diaryRepo.find({
      where: {
        author: { id: memberId },
        latitude: Not(IsNull()),
      },
    });
    let res = new DiaryMapRes();
    for (const diary of result) {
      let dto = new DiaryMapInfo();
      dto.diaryId = diary.id
      dto.photo_path = diary.photo_path[0]
      dto.latitude = diary.latitude! // null이 아님을 보장
      dto.longitude = diary.longitude!
      dto.content = diary.content.slice(0, 100) + "..."
      res.result.push(dto)
    }

    return res
  }
}
