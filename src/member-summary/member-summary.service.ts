import { Injectable } from '@nestjs/common';
import { MemberSummary } from '../entities/member-summary.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberService } from '../member/member.service';
import { DiaryEmotionGroupingDto } from './dto/diary-emotion-grouping.dto';
import { EmotionGroup, EmotionType, getEmotionGroup } from '../enums/emotion-type.enum';
import { EmotionSummaryScore } from '../entities/emotion-summary-score.entity';
import { DiaryAnalysisDto } from '../analysis/dto/diary-analysis.dto';

@Injectable()
export class MemberSummaryService {
  constructor(
    @InjectRepository(MemberSummary)
    private readonly repo: Repository<MemberSummary>,
    @InjectRepository(EmotionSummaryScore)
    private readonly emotionSummaryRepo: Repository<EmotionSummaryScore>,
    private readonly memberService: MemberService,
  ) {}

  async findMemberSummaryIfNotExistCreate(memberId: string, date: Date) {
    const member = await this.memberService.findOne(memberId);

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

  async findEmotionSummaryIfNotExistCreate(
    summary: MemberSummary,
    emotion: EmotionGroup,
  ) {
    let emotionSummary = await this.emotionSummaryRepo.findOneBy(
      {summary, emotion},
    );

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
        await this.updateEmotion(memberId, date, feel.emotionType, feel.intensity);
      }
    }
  }

  async updateEmotion(
    memberId: string,
    date: Date,
    emotion: EmotionType,
    intensity: number
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
