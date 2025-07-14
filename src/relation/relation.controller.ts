import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { RelationService } from './relation.service';
import { GraphRes } from './dto/graph.res';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TargetDetailAnalysis } from './dto/target-detail-analysis';

@Controller('relation')
@ApiTags('관계/대상')
export class RelationController {
  constructor(private readonly relationService: RelationService) {}

  @ApiOperation({
    summary: '본인의 관계 그래프 조회',
    description: 'access token 필요',
  })
  @ApiResponse({
    status: 200,
    description: '관계 그래프 조회',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: GraphRes })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getRelation(@CurrentUser() user): Promise<GraphRes> {
    const memberId = user.id;
    return await this.relationService.getGraph(memberId);
  }

  @ApiOperation({
    summary: '대상 상세 분석 조회',
    description: '대상이 등장한 일기와 대상에 대한 날짜별 감정을 반환합니다',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '대상 ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '대상 상세 분석 정보 조회',
    type: TargetDetailAnalysis,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseGuards(AuthGuard('jwt'))
  @Get('detail/:id')
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const memberId: string = user.id;
    const result = this.relationService.getTargetDetailAnalysis(memberId, id);

    return result;
  }
}
