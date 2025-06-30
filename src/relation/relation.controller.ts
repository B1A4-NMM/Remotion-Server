import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { RelationGraphRes } from './dto/relation-graph.res';
import { TargetService } from '../target/target.service';
import { RelationService } from './relation.service';

@Controller('relation')
export class RelationController {
  constructor(private readonly relationService: RelationService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getRelation(@CurrentUser() user): Promise<RelationGraphRes> {
    const memberId = user.id;
    return await this.relationService.getRelation(memberId);
  }
}
