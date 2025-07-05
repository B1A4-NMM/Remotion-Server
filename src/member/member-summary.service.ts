import { Injectable } from '@nestjs/common';
import { MemberSummary } from '../entities/member-summary.entity';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberService } from './member.service';
import {
  EmotionGroup,
  EmotionType,
  getEmotionGroup,
} from '../enums/emotion-type.enum';
import { EmotionSummaryScore } from '../entities/emotion-summary-score.entity';
import { DiaryAnalysisDto } from '../analysis/dto/diary-analysis.dto';
import { MemberSummaryRes } from './dto/member-summary.res';
import { CommonUtilService } from '../util/common-util.service';

@Injectable()
export class MemberSummaryService {
  constructor(
    @InjectRepository(MemberSummary)
    private readonly repo: Repository<MemberSummary>,
    @InjectRepository(EmotionSummaryScore)
    private readonly emotionSummaryRepo: Repository<EmotionSummaryScore>,
    private readonly memberService: MemberService,
    private readonly util: CommonUtilService,
  ) {}

  async findMemberSummaryByPeriod(memberId: string, period: number) {
    const member = await this.memberService.findOne(memberId);
    const today = new Date();
    const end = new Date(today.getDate() - period);

    const result = await this.repo.find({
      where: { member: member, date: Between(end, today) },
      relations: ['emotionScores'],
    });

    return this.createMemberSummaryRes(result, period);
  }

  async createMemberSummaryRes(
    summaries: MemberSummary[],
    period: number,
  ): Promise<MemberSummaryRes> {
    const result = new MemberSummaryRes();
    for (const summary of summaries) {
      const date = summary.date;
      const emotionArr: any[] = [];
      for (const emotionGroup of summary.emotionScores) {
        emotionArr.push({
          emotion: emotionGroup.emotion,
          score: emotionGroup.score / emotionGroup.count,
        });
      }
      result.emotionsPerDate.push({
        date: date,
        emotions: emotionArr,
      });
    }
    result.period = period;
    result.depressionWarning = false;
    result.stressWarning = false;
    result.anxietyWarning = false;

    return result;
  }

  async findMemberSummaryIfNotExistCreate(memberId: string, date: Date) {
    const member = await this.memberService.findOne(memberId);

    console.log('생성 날짜 : ' + date);

    let summary = await this.repo.findOne({
      where: { member: member },
    });

    const dateFormat = this.util.formatDateToYMD(date);

    // @ts-ignore
    if (summary === null || summary.date != dateFormat) {
      summary = new MemberSummary();
      summary.member = member;
      summary.date = date;
      summary = await this.repo.save(summary);
    }

    console.log('생성된 날짜 : ' + summary.date);
    console.log('둘이 같은가?', summary.date === date);

    return summary;
  }

  async findEmotionSummaryIfNotExistCreate(
    summary: MemberSummary,
    emotion: EmotionGroup,
  ) {
    let emotionSummary = await this.emotionSummaryRepo.findOneBy({
      summary,
      emotion,
    });

    if (emotionSummary === null) {
      emotionSummary = new EmotionSummaryScore();
      emotionSummary.summary = summary;
      emotionSummary.emotion = emotion;
      emotionSummary.score = 0;
      emotionSummary.count = 0;
    }

    return emotionSummary;
  }

  async updateSummaryFromDiary(
    dto: DiaryAnalysisDto,
    memberId: string,
    date: Date,
  ) {
    for (const person of dto.people) {
      for (const feel of person.feel) {
        await this.updateEmotion(
          memberId,
          date,
          feel.emotionType,
          feel.intensity,
        );
      }
    }

    for (const emotion of dto.selfEmotion) {
      await this.updateEmotion(
        memberId,
        date,
        emotion.emotionType,
        emotion.intensity,
      );
    }

    for (const emotion of dto.stateEmotion) {
      await this.updateEmotion(
        memberId,
        date,
        emotion.emotionType,
        emotion.intensity,
      );
    }
  }

  async updateEmotion(
    memberId: string,
    date: Date,
    emotion: EmotionType,
    intensity: number,
  ) {
    const summary = await this.findMemberSummaryIfNotExistCreate(
      memberId,
      date,
    );

    let emotionSummary = await this.findEmotionSummaryIfNotExistCreate(
      summary,
      getEmotionGroup(emotion),
    );

    switch (getEmotionGroup(emotion)) {
      case EmotionGroup.우울:
        emotionSummary.emotion = EmotionGroup.우울;
        emotionSummary.score += intensity;
        emotionSummary.count++;
        break;
      case EmotionGroup.스트레스:
        emotionSummary.emotion = EmotionGroup.스트레스;
        emotionSummary.score += intensity;
        emotionSummary.count++;
        break;
      case EmotionGroup.불안:
        emotionSummary.emotion = EmotionGroup.불안;
        emotionSummary.score += intensity;
        emotionSummary.count++;
        break;
      case EmotionGroup.안정:
        emotionSummary.emotion = EmotionGroup.안정;
        emotionSummary.score += intensity;
        emotionSummary.count++;
        break;
      case EmotionGroup.활력:
        emotionSummary.emotion = EmotionGroup.활력;
        emotionSummary.score += intensity;
        emotionSummary.count++;
        break;
      case EmotionGroup.유대:
        emotionSummary.emotion = EmotionGroup.유대;
        emotionSummary.score += intensity;
        emotionSummary.count++;
        break;
      default:
        break;
    }

    await this.emotionSummaryRepo.save(emotionSummary);
  }
}
