import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';

@Controller('activity')
@ApiExcludeController()
export class ActivityController {

  constructor(private readonly activityService: ActivityService) {
  }

  @Get('period')
  @UseGuards(AuthGuard('jwt'))
  async getCluster(@Query('period') period: number, @CurrentUser() user:any) {
    const memberId = user.id;
    return this.activityService.getActivitiesByPeriod(period, memberId)
  }

}