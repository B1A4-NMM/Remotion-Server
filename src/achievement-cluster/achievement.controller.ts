import { Body, Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllAchievementRes } from '../member/dto/all-achievement.res';
import { AchievementClusterService } from './achievement-cluster.service';

@Controller('achievement')
@ApiTags('성취')
export class AchievementController {
  constructor(
    private readonly service: AchievementService,
    private readonly clusterService: AchievementClusterService,
  ) {}

  @Get('all')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '모든 성취 조회',
    description: '사용자의 모든 성취 클러스터를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '성취 클러스터 조회 성공',
    type: AllAchievementRes,
  })
  async getAllAchievement(@CurrentUser() user: any) {
    const memberId = user.id;
    return this.service.getAllAchievementCluster(memberId);
  }

  @Delete()
  async delete(@Body('id') id: string) {
    await this.clusterService.deleteById(id);
  }
}
