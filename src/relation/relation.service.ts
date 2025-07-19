import { Injectable } from '@nestjs/common';
import { TargetService } from '../target/target.service';
import { RelationGraphDto } from './dto/relation-graph.dto';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionService } from '../emotion/emotion.service';
import { GraphRes } from './dto/graph.res';
import { DiaryService } from '../diary/diary.service';
import { DiaryRes } from '../diary/dto/diary-home-list.res';
import { TargetActivityRes, TargetDetailAnalysis } from './dto/target-detail-analysis';

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
    const allTargets = await this.targetService.findAll(memberId);
    let res = new RelationGraphDto();

    if (allTargets.length === 0) {
      return res;
    }

    // count 기준으로 상위 12명 필터링
    const topTargets = allTargets
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // affection과 count를 합산한 점수 생성
    const combinedScores = topTargets.map(
      (target) => target.affection + target.count,
    );
    const minScore = Math.min(...combinedScores);
    const maxScore = Math.max(...combinedScores);

    for (const target of topTargets) {
      let emotion = await this.emotionService.topEmotionsToTargetSecond(target);
      if (!emotion || emotion.length === 0) continue;

      const combinedScore = target.affection + target.count;
      const normalizedAffection = this.normalize(
        combinedScore,
        minScore,
        maxScore,
      );

      res.relations.push({
        id: target.id,
        name: target.name,
        affection: normalizedAffection,
        highestEmotion: emotion[0].emotion,
        secondEmotion: emotion[1]?.emotion ?? null,
        count: target.count,
      });
    }

    return res;
  }

  /**
   * 점수를 30에서 150 사이로 정규화합니다.
   * 가장 높은 점수는 30, 가장 낮은 점수는 150으로 변환됩니다.
   * @param score 정규화할 점수 (affection + count)
   * @param minScore 점수 중 최소값
   * @param maxScore 점수 중 최대값
   * @returns 정규화된 값
   */
  private normalize(
    score: number,
    minScore: number,
    maxScore: number,
  ): number {
    if (minScore === maxScore) {
      return 30; // 모든 값이 같을 경우 최소값(가장 가까운 거리)으로 설정
    }
    const normalized = 
      150 - (score - minScore) * (120 / (maxScore - minScore));
    return Math.round(normalized);
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
    const bonusScore = await this.targetService.getRecentMentionsScore(targetId)

    for (const diary of diaries) {
      diaryRes.push(await this.diaryService.createDiaryRes(diary));
    }
    diaryRes.sort((a, b) => a.writtenDate.compareTo(b.writtenDate));

    const activityClusters = await this.targetService.analyzeActivityClustersByTarget(targetId)
    const activityRes = activityClusters.map((a) => {
      const res = new TargetActivityRes()
      res.count = a.count
      res.content = a.content
      return res
    })

    return new TargetDetailAnalysis(target, remotionDetails, diaryRes, activityRes, bonusScore);
  }
}
