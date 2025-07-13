import { Injectable } from '@nestjs/common';
import { TargetService } from '../target/target.service';
import { RelationGraphDto } from './dto/relation-graph.dto';
import { CommonUtilService } from '../util/common-util.service';
import { EmotionService } from '../emotion/emotion.service';
import { GraphRes } from './dto/graph.res';

@Injectable()
export class RelationService {
  constructor(
    private readonly targetService: TargetService,
    private readonly emotionService: EmotionService,
  ) {}

  /**
   * 관계 그래프를 만들어 반환합니다 
   */
  async getGraph(memberId: string) {
    const relation = await this.getRelation(memberId);
    const emotions = await this.emotionService.getTodayEmotions(memberId);
    const result = new GraphRes()
    result.relations = relation
    result.todayMyEmotions = emotions

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
      let emotion = await this.emotionService.topEmotionsToTagetSecond(target);
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



}
