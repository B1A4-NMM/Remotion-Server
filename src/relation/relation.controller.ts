import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { RelationService } from './relation.service';
import { GraphRes } from './dto/graph.res';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('relation')
@ApiTags('관계 그래프')
export class RelationController {
  constructor(private readonly relationService: RelationService) {}

  @ApiOperation({ summary: '본인의 관계 그래프 조회' , description: 'access token 필요'})
  @ApiResponse({
    status: 200,
    description: '관계 그래프 조회',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({type: GraphRes})
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getRelation(@CurrentUser() user): Promise<GraphRes> {
    const memberId = user.id;
    return await this.relationService.getGraph(memberId);
  }
}
