import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ActivityClusterService } from './activity-cluster.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';

@Controller('activity-cluster')
export class ActivityClusterController {

  constructor(private readonly activityClusterService: ActivityClusterService) {
  }

  @Delete()
  async delete() {
      await this.activityClusterService.deleteAllVector()
  }

  @Get('top')
  @UseGuards(AuthGuard('jwt'))
  async getTopEmotions(@Param('limit') limit: number, @CurrentUser() user: any) {
    const memberId = user.id;
    return this.activityClusterService.getTopEmotionsByMember(memberId, limit)
  }

}
