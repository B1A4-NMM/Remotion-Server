import { Injectable } from '@nestjs/common';
import { TargetService } from '../target/target.service';
import { RelationGraphRes } from './dto/relation-graph.res';

@Injectable()
export class RelationService {
  constructor(private readonly targetService: TargetService) {}

  async getRelation(memberId: string): Promise<RelationGraphRes> {
    const result = await this.targetService.findAll(memberId);
    let res = new RelationGraphRes();

    for (const t of result) {
      res.relations.push({
        name: t.name,
        affection: t.affection,
      });
    }

    return res;
  }
}
