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

  async getGraph(memberId: string) {
    const relation = await this.getRelation(memberId);
    const emotions = await this.emotionService.getTodayEmotions(memberId);
    const result = new GraphRes()
    result.relations = relation
    result.todayMyEmotions = emotions

    return result;
  }

  async getRelation(memberId: string): Promise<RelationGraphDto> {
    const result = await this.targetService.findAll(memberId);
    let res = new RelationGraphDto();

    for (const target of result) {
      let emotion = await this.emotionService.topEmotionsToTagetSecond(target);
      res.relations.push({
        name: target.name,
        affection: target.affection,
        highestEmotion: emotion[0].emotion,
        secondEmotion: emotion[1]?.emotion ?? null ,
        count: target.count
      });
    }

    return res;
  }

}
