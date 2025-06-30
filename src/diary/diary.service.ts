import { Injectable } from '@nestjs/common';
import { AnalysisDiaryService } from '../analysis/analysis-diary.service';
import { MemberService } from '../member/member.service';
import { Diary } from '../entities/Diary.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityService } from '../activity/activity.service';
import { TargetService } from '../target/target.service';
import { CommonUtilService } from '../util/common-util.service';
import { DiaryListRes, DiaryRes } from './dto/diary-list.res';

@Injectable()
export class DiaryService {
  constructor(
    private readonly analysisDiaryService: AnalysisDiaryService,
    private readonly memberService: MemberService,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    private readonly activityService: ActivityService,
    private readonly targetService: TargetService,
    private readonly utilService: CommonUtilService,
  ) {}

  async createDiary(memberId: string, dto: CreateDiaryDto) {
    const result = await this.analysisDiaryService.analysisDiary(dto.content);

    const member = await this.memberService.findOne(memberId);
    const diary = new Diary();
    diary.author = member;
    diary.written_date = dto.writtenDate;
    diary.content = dto.content;
    diary.title = 'demo';

    const saveDiary = await this.diaryRepository.save(diary);

    await this.activityService.createByDiary(result, saveDiary);
    await this.targetService.createByDiary(result, saveDiary, memberId);

    return result;
  }

  async getDiaryList(memberId: string) {
    const member = await this.memberService.findOne(memberId);
    const diaries = await this.diaryRepository.find({
      where: { author: member },
      order: {
        written_date: 'DESC',
      },
      relations: ['diaryTargets','diaryTargets.target', 'diaryEmotions'],
    });

    const res: DiaryListRes = new DiaryListRes();
    for (const diary of diaries) {
      let diaryRes = new DiaryRes();
      diaryRes.diaryId = diary.id
      diaryRes.title = diary.title
      diaryRes.writtenDate = diary.written_date

      diary.diaryEmotions.forEach(emotion => {
        diaryRes.emotions.push(emotion.emotion)
      })

      diary.diaryTargets.forEach(target => {
        diaryRes.targets.push(target.target.name)
      })

      res.diaries.push(diaryRes)
    }

    return res
  }


}