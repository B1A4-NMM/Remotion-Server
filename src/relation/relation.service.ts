import { Injectable } from '@nestjs/common';
import { TargetService } from '../target/target.service';
import { RelationGraphDto } from './dto/relation-graph.dto';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionService } from '../emotion/emotion.service';
import { GraphRes } from './dto/graph.res';
import { DiaryService } from '../diary/diary.service';
import { DiaryRes } from '../diary/dto/diary-home-list.res';
import { TargetDetailAnalysis } from './dto/target-detail-analysis';

@Injectable()
export class RelationService {
  constructor(
    private readonly targetService: TargetService,
    private readonly emotionService: EmotionService,
    private readonly diaryService: DiaryService,
  ) {}

  /**
   * 관계 그래프를 만들어 반환합니다
   */
  async getGraph(memberId: string) {
    const relation = await this.getRelation(memberId);
    const emotions = await this.emotionService.getTodayEmotions(memberId);
    const result = new GraphRes();
    result.relations = relation;
    result.todayMyEmotions = emotions;

    return result;
  }

  /**
   * 멤버의 전체 관계 데이터를 조회합니다.
   * @param memberId 조회할 멤버의 ID
   * @returns 각 관계 대상의 ID, 이름, 친밀도, 주요 감정 정보를 담은 RelationGraphDto 객체
   */
  async getRelation(memberId: string): Promise<RelationGraphDto> {
    const result = await this.targetService.findAll(memberId);
    let res = new RelationGraphDto();

    for (const target of result) {
      let emotion = await this.emotionService.topEmotionsToTargetSecond(target);
      if (!emotion || emotion.length === 0) continue;
      res.relations.push({
        id: target.id,
        name: target.name,
        affection: target.affection,
        highestEmotion: emotion[0].emotion,
        secondEmotion: emotion[1]?.emotion ?? null,
        count: target.count,
      });
    }

    return res;
  }

  /**
   * 멤버가 입력한 대상에 대한 상세 분석 정보를 반환합니다
   * @param memberId 조회할 멤버의 ID
   * @param targetId 분석할 대상의 ID
   * @returns 대상의 상세정보, 감정 요약, 관련 일기 목록을 담은 TargetDetailAnalysis 객체
   */
  async getTargetDetailAnalysis(memberId: string, targetId: number) {
    const target = await this.targetService.findOneById(memberId, targetId);
    const remotionDetails =
      await this.emotionService.getEmotionSummaryByTarget(targetId);
    const diaries = await this.targetService.getDiariesByTarget(targetId);
    const diaryRes: DiaryRes[] = [];

    for (const diary of diaries) {
      diaryRes.push(await this.diaryService.createDiaryRes(diary));
    }
    diaryRes.sort((a, b) => a.writtenDate.compareTo(b.writtenDate));

    return new TargetDetailAnalysis(target, remotionDetails, diaryRes);
  }
}
