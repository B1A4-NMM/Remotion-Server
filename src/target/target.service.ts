import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Target } from '../entities/Target.entity';
import { Repository } from 'typeorm';
import {
  DiaryAnalysisDto,
  EmotionAnalysisDto,
} from '../analysis/dto/diary-analysis.dto';
import { Diary } from '../entities/Diary.entity';
import { MemberService } from '../member/member.service';
import { CommonUtilService } from '../util/common-util.service';
import { TargetRelation } from '../enums/target.enum';
import { DiaryTarget } from '../entities/diary-target.entity';
import * as process from 'node:process';
import { EmotionService } from '../emotion/emotion.service';
import { EmotionType } from '../enums/emotion-type.enum';
import { MemberSummaryService } from '../member/member-summary.service';
import { DiaryEmotionGroupingDto } from '../member/dto/diary-emotion-grouping.dto';
import { LocalDate } from 'js-joda';

@Injectable()
export class TargetService {
  constructor(
    @InjectRepository(Target)
    private readonly targetRepository: Repository<Target>,
    @InjectRepository(DiaryTarget)
    private readonly diaryTargetRepository: Repository<DiaryTarget>,
    private readonly memberService: MemberService,
    private readonly util: CommonUtilService,
    private readonly emotionService: EmotionService,
  ) {}

  /**
   * 일기에 나타난 대상을 저장하는 함수
   * 대상이 없다면 생성하고, 있다면 심적 거리나 최근 언급 일자를 갱신
   * 대상을 저장한 후, 대상에 나타난 감정을 같이 저장
   * 이후 다이어리-감정 엔티티도 같이 저장함 -> 수정이 필요할지도?
   */
  async createByDiary(dto: DiaryAnalysisDto, diary: Diary, memberId: string) {
    const member = await this.memberService.findOne(memberId);

    for (const person of dto.people) {
      let target = await this.findOne(memberId, person.name);
      if (target === null) {
        // 대상이 없다면 생성
        target = new Target(
          person.name,
          1,
          LocalDate.now(),
          TargetRelation.ETC,
          await this.calculateAffection(person.feel),
          member,
        );

      } else {
        // 있으면 갱신
        target.affection += await this.calculateAffection(person.feel);
        target.recent_date = LocalDate.now();
        target.count += 1;
        // DONE : emotionTarget도 갱신해야할듯
      }

      target = await this.targetRepository.save(target);
      await this.createDiaryTarget(target, diary);
      await this.emotionService.createDiaryEmotionForTarget(person.feel, diary);
      await this.emotionService.createOrUpdateEmotionTarget(target, person.feel);
    }
  }

  async createDiaryTarget(target: Target, diary: Diary) {
    let diaryTarget = await this.diaryTargetRepository.findOneBy({
      diary: diary,
      target: target,
    });
    if (diaryTarget === null) {
      diaryTarget = new DiaryTarget(diary, target);
      await this.diaryTargetRepository.save(diaryTarget);
    }
  }

  async findOne(memberId: string, targetName: string) {
    const member = await this.memberService.findOne(memberId);

    return await this.targetRepository.findOneBy({
      member: member,
      name: targetName,
    });
  }

  async findAll(memberId: string) {
    const member = await this.memberService.findOne(memberId);

    const result = await this.targetRepository.find({
      where: { member: member },
      order: {
        affection: 'DESC',
      },
    });

    return result;
  }

  /**
   * 감정에 따라 심적거리를 계산하는 함수
   * 해당 감정에 나타난 강도를 나누어 더하는 식으로 계산함
   */
  async calculateAffection(emotions: EmotionAnalysisDto[]) {
    let affection = 0;

    for (const { emotionType, intensity } of emotions) {
      switch (emotionType) {
        // 긍정적 affection
        case EmotionType.사랑:
        case EmotionType.유대:
        case EmotionType.친밀:
        case EmotionType.애정:
        case EmotionType.존경:
          affection += intensity / 3;
          break;

        case EmotionType.신뢰:
        case EmotionType.공감:
        case EmotionType.감사:
          affection += intensity / 4;
          break;

        // 중립적 또는 애매한 영향
        case EmotionType.거부감:
        case EmotionType.시기:
        case EmotionType.질투:
        case EmotionType.실망:
        case EmotionType.억울:
          affection -= intensity / 5;
          break;

        // 강한 부정 감정 → affection 감소 크게
        case EmotionType.분노:
        case EmotionType.짜증:
        case EmotionType.속상:
        case EmotionType.상처:
        case EmotionType.배신감:
        case EmotionType.경멸:
        case EmotionType.불쾌:
          affection -= intensity / 3;
          break;

        default:
          // affection에 영향을 주지 않는 감정은 무시
          break;
      }
    }

    return affection;
  }

}
