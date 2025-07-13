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
import { MemberSummaryRes } from './dto/member-summary.res';
import { CommonUtilService } from '../util/common-util.service';
import { LocalDate } from 'js-joda';
import { Member } from '../entities/Member.entity';
import { CombinedEmotion } from '../util/json.parser';
import * as process from 'node:process';
import { PeopleAnalysisDto } from '../diary/dto/diary-analysis.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MemberSummaryService {

  constructor(
    @InjectRepository(MemberSummary)
    private readonly repo: Repository<MemberSummary>,
    @InjectRepository(EmotionSummaryScore)
    private readonly emotionSummaryRepo: Repository<EmotionSummaryScore>,
    private readonly util: CommonUtilService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 기간과 멤버 아이디를 받아 해당 기간 내의 사용자 요약 응답을 만들어 반환합니다
   */
  async findMemberSummaryByPeriod(memberId: string, period: number) {
    const today = LocalDate.now();
    const end = today.minusDays(period);

    const result = await this.repo.find({
      where: { member: {id: memberId}, date: Between(end, today) },
      relations: ['emotionScores'],
    });

    return this.createMemberSummaryRes(result, period);
  }

  /**
   * 기간과 memberSummary 배열을 받아 사용자 요약 응답을 반환합니다
   */
  private async createMemberSummaryRes(
    summaries: MemberSummary[],
    period: number,
  ): Promise<MemberSummaryRes> {
    const result = new MemberSummaryRes();
    result.period = period;
    result.depressionWarning = false;
    result.stressWarning = false;
    result.anxietyWarning = false;

    const totalEmotionScores: Record<EmotionGroup, number> = {
      [EmotionGroup.우울]: 0,
      [EmotionGroup.스트레스]: 0,
      [EmotionGroup.불안]: 0,
      [EmotionGroup.안정]: 0,
      [EmotionGroup.활력]: 0,
      [EmotionGroup.유대]: 0,
    };

    for (const summary of summaries) {
      const date = summary.date;
      const emotionArr: any[] = [];
      for (const emotionScore of summary.emotionScores) {
        // EmotionGroup별로 score 합산
        totalEmotionScores[emotionScore.emotion] += emotionScore.score;

        emotionArr.push({
          emotion: emotionScore.emotion,
          score: emotionScore.score / emotionScore.count, // 평균 점수
        });
      }
      result.emotionsPerDate.push({
        date: date,
        emotions: emotionArr,
      });
    }

    console.log("스트레스 종합 : " + totalEmotionScores[EmotionGroup.스트레스])
    console.log("우울 종합 : " + totalEmotionScores[EmotionGroup.스트레스])
    console.log("불안 종합 : " + totalEmotionScores[EmotionGroup.스트레스])

    // 임계값 검사 및 경고 플래그 설정
    let threshold = this.configService.get('WARNING_THRESHOLD');
    console.log("임계값 = " + threshold)
    if (totalEmotionScores[EmotionGroup.우울] > threshold
    ) {
      result.depressionWarning = true;
    }
    if (totalEmotionScores[EmotionGroup.스트레스] > threshold
    ) {
      result.stressWarning = true;
    }
    if (totalEmotionScores[EmotionGroup.불안] > threshold
    ) {
      result.anxietyWarning = true;
    }

    return result;
  }

  /**
   * 사용자 요약 엔티티를 찾아 반환하고, 만약 없다면 만들어서 반환합니다
   */
  async findMemberSummaryIfNotExistCreate(member: Member, date: LocalDate) {

    let summary = await this.repo.findOne({
      where: { member: member, date: date },
    });

    if (summary === null) {
      summary = new MemberSummary();
      summary.member = member;
      summary.date = date;
      summary = await this.repo.save(summary);
    }

    return summary;
  }

  /**
   * 감정요약이 있는지 확인하고, 없다면 생성한 다음 반환합니다
   */
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

  /**
   * 일기로부터 감정 요약이 업데이트됩니다
   */
  async updateSummaryFromDiary(
    people: PeopleAnalysisDto[],
    selfEmotions: CombinedEmotion[],
    stateEmotions: CombinedEmotion[],
    member: Member,
    date: LocalDate,
  ) {
    for (const person of people) {
      for (const feel of person.feel) {
        await this.updateEmotion(
          member,
          date,
          feel.emotionType,
          feel.intensity,
        );
      }
    }

    for (const emotion of selfEmotions) {
      await this.updateEmotion(
        member,
        date,
        emotion.emotion,
        emotion.intensity,
      );
    }

    for (const emotion of stateEmotions) {
      await this.updateEmotion(
        member,
        date,
        emotion.emotion,
        emotion.intensity,
      );
    }
  }

  /**
   * 감정 요약 엔티티를 업데이트합니다, 감정 요약 그룹에 카운트와 강도가 합산됩니다
   */
  async updateEmotion(
    member: Member,
    date: LocalDate,
    emotion: EmotionType,
    intensity: number,
  ) {
    const summary = await this.findMemberSummaryIfNotExistCreate(
      member,
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