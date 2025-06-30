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
        const newTarget = new Target(
          person.name,
          1,
          this.util.getCurrentDateToISOString(),
          TargetRelation.ETC,
          await this.calculateAffection(person.feel),
          member,
        );

        const saveTarget = await this.targetRepository.save(newTarget);
        const diaryTarget = new DiaryTarget(diary, saveTarget);
        await this.diaryTargetRepository.save(diaryTarget);
        await this.emotionService.createEmotionTarget(saveTarget, person.feel);
      } else {
        // 있으면 갱신
        target.count += await this.calculateAffection(person.feel);
        target.recent_date = this.util.getCurrentDateToISOString();
        target.affection += 1;
        await this.targetRepository.save(target);
      }

      await this.emotionService.createDiaryEmotion(person.feel, diary)
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
    })

    return result;
  }

  /**
   * 감정에 따라 심적거리를 계산하는 함수
   * 해당 감정에 나타난 강도를 나누어 더하는 식으로 계산함
   */
  async calculateAffection(emotions: EmotionAnalysisDto[]) {
    let affection = 0;
    for (const emotion of emotions) {
      switch (emotion.emotionType) {
        case EmotionType.행복:
        case EmotionType.기쁨:
        case EmotionType.기쁨:
        case EmotionType.신남:
        case EmotionType.설렘:
        case EmotionType.유대:
        case EmotionType.신뢰:
        case EmotionType.존경:
        case EmotionType.친밀:
          affection += (emotion.intensity / 3);
          break;
        case EmotionType.자신감:
        case EmotionType.편안:
        case EmotionType.평온:
        case EmotionType.안정:
        case EmotionType.감사:
        case EmotionType.차분:
        case EmotionType.기대:
          affection += (emotion.intensity / 4);
          break;
        case EmotionType.무난:
        case EmotionType.지루:
        case EmotionType.긴장:
          affection += (emotion.intensity / 5);
          break;
        case EmotionType.서운:
        case EmotionType.시기:
        case EmotionType.소외:
        case EmotionType.실망:
        case EmotionType.속상:
        case EmotionType.무기력:
        case EmotionType.지침:
        case EmotionType.초조:
        case EmotionType.부담:
        case EmotionType.어색:
          affection += (emotion.intensity / 6);
          break;
        case EmotionType.불안:
        case EmotionType.상처:
        case EmotionType.화남:
        case EmotionType.짜증:
        case EmotionType.억울:
        case EmotionType.외로움:
        case EmotionType.우울:
        case EmotionType.공허:
        case EmotionType.불편:
        case EmotionType.단절:
          affection += (emotion.intensity / 7);
          break;
        default:
          break;
      }
    }
    return affection;
  }
}
