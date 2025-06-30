import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Target } from '../entities/Target.entity';
import { Repository } from 'typeorm';
import { DiaryAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { Diary } from '../entities/Diary.entity';
import { MemberService } from '../member/member.service';
import { CommonUtilService } from '../util/common-util.service';
import { TargetRelation } from '../enums/target.enum';
import { DiaryTarget } from '../entities/diary-target.entity';
import * as process from 'node:process';
import { EmotionService } from '../emotion/emotion.service';

@Injectable()
export class TargetService {
  constructor(
    @InjectRepository(Target)
    private readonly targetRepository: Repository<Target>,
    @InjectRepository(DiaryTarget)
    private readonly diaryTargetRepository: Repository<DiaryTarget>,
    private readonly memberService: MemberService,
    private readonly util: CommonUtilService,
    private readonly emotionService : EmotionService
  ) {}

  async createByDiary(dto: DiaryAnalysisDto, diary: Diary, memberId: string) {
    const member = await this.memberService.findOne(memberId);

    for (const person of dto.people) {
      let target = await this.findOne(memberId, person.name);
      if (target === null) { // 대상이 없다면 생성
        const newTarget = new Target(
          person.name,
          1,
          this.util.getCurrentDateToISOString(),
          TargetRelation.ETC,
          0,
          member
        );

      const saveTarget = await this.targetRepository.save(newTarget);
      const diaryTarget = new DiaryTarget(diary, saveTarget);
      await this.diaryTargetRepository.save(diaryTarget);
      await this.emotionService.createByTarget(saveTarget, person.feel);
      } else { // 있으면 갱신
        target.count += 1;
        target.recent_date = this.util.getCurrentDateToISOString();
        target.affection += 1
        await this.targetRepository.save(target);
      }
    }
  }

  async findOne(memberId: string, targetName: string) {
    const member = await this.memberService.findOne(memberId);

    return await this.targetRepository.findOneBy({
      member: member,
      name: targetName,
    });
  }
}
