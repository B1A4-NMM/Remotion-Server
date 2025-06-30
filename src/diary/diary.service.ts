import { Injectable } from '@nestjs/common';
import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { Diary } from '../entities/Diary.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityService } from '../activity/activity.service';
import { TargetService } from '../target/target.service';

@Injectable()
export class DiaryService {

  constructor(
    private readonly analysisDiaryService: AnalysisDiaryService,
    private readonly memberService: MemberService,
    @InjectRepository(Diary) private readonly diaryRepository: Repository<Diary>,
    private readonly activityService: ActivityService,
    private readonly targetService: TargetService,
  ) {
  }

  async createDiary(memberId:string ,dto: CreateDiaryDto) {
    const result = await this.analysisDiaryService.analysisDiary(dto.content)

    const member = await this.memberService.findOne(memberId)
    const diary = new Diary()
    diary.author = member
    diary.written_date = dto.writtenDate
    diary.content = dto.content
    diary.title = "demo"

    console.log(`diary create, diary ${diary}`)
    const saveDiary = await this.diaryRepository.save(diary);

    await this.activityService.createByDiary(result, saveDiary)
    await this.targetService.createByDiary(result, saveDiary, memberId)

    return result;
  }

}