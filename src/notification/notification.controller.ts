import { Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { NotificationRes } from './dto/notification.res';

@Controller('noti')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '안읽은 알림 목록 조회' })
  @ApiOkResponse({
    description: '안읽은 알림 목록',
    type: [NotificationRes],
  })
  async getNotification(@CurrentUser() user: any) {
    return this.notificationService.getNotificationNoRead(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiOkResponse({
    description: '알림 읽음 처리 완료',
  })
  async readNotification(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.readNotification(user.id, id);
  }

  @Get('all')
  @ApiOperation({ summary: '모든 알림 목록 조회' })
  @ApiOkResponse({
    description: '모든 알림 목록',
    type: [NotificationRes],
  })
  async getNotificationAll(@CurrentUser() user: any) {
    return this.notificationService.getNotificationAll(user.id);
  }
}
