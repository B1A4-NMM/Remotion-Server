import { Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger'; // ApiExcludeEndpoint 임포트
import { NotificationRes } from './dto/notification.res';
import { NotificationType } from '../enums/notification-type.enum'; // NotificationType 임포트
import { LocalDate, LocalDateTime } from 'js-joda'; // LocalDateTime 임포트

@Controller('noti')
@ApiTags('알림')
@ApiBearerAuth()
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

  @Get('count')
  @ApiOperation({ summary: '안읽은 알림 갯수 조회' })
  @ApiOkResponse({
    description: '안읽은 알림 갯수',
    type: Number,
  })
  async getNotificationCount(@CurrentUser() user: any) {
    return this.notificationService.getNoReadNotificationCount(user.id);
  }

  // 테스트용 엔드포인트 추가
  @Post('test-create')
  @ApiExcludeEndpoint() // Swagger에서 숨김
  async createTestNotification(@CurrentUser() user: any) {
    // 테스트를 위한 더미 데이터
    const content = '테스트 알림입니다.';
    const type = NotificationType.RECAP; // 예시 타입
    const photoPath = 'https://example.com/test.png';
    const diaryId = 1; // 예시 ID
    const targetDate = LocalDate.now(); // LocalDate.now(); // 필요하다면 LocalDate.now() 사용

    return this.notificationService.createTestNotification(
      user.id,
      content,
      type,
      null,
      photoPath,
      targetDate,
    );
  }
}
