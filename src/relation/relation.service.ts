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
    private readonly utilService: CommonUtilService,
    private readonly emotionService: EmotionService,
  ) {}

  async getGraph(memberId: string) {
    const relation = await this.getRelation(memberId);
    const emotions = await this.getTodayEmotions(memberId);
    const result = new GraphRes()
    result.relations = relation
    result.TodayMyEmotions = emotions

    return result;
  }

  async getRelation(memberId: string): Promise<RelationGraphDto> {
    const result = await this.targetService.findAll(memberId);
    let res = new RelationGraphDto();

    for (const t of result) {
      let emotion = await this.emotionService.highestEmotionToTarget(t);
      res.relations.push({
        name: t.name,
        affection: t.affection,
        highestEmotion: emotion
      });
    }

    return res;
  }

  async getTodayEmotions(memberId: string) {
    const date = this.utilService.getCurrentDate()
    const emotions =
      await this.emotionService.sumIntensityByEmotionForDateAndOwner(
        date,
        memberId,
      );
    const result: any[] = []
    for (const r of emotions) {
      result.push({emotion: r.emotion, intensity: parseFloat(r.totalIntensity)})
    }

    return result;
  }
}
