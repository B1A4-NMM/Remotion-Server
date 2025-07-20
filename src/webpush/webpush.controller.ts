import { Controller, Post, Body, UseGuards, BadRequestException, Get, Query } from '@nestjs/common';
import { WebpushService } from './webpush.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export interface PushSubscriptionInterface {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationOptions {
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  vibrate?: number[];
  data?: any;
  actions?: PushAction[];
}

export interface PushAction {
  action: string;
  title: string;
  icon?: string;
}

@Controller('webpush')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Web-Push')
export class WebpushController {
  constructor(private readonly webpushService: WebpushService) {}

  @Post('subscribe')
  @ApiOperation({
    summary: '웹 푸시 구독',
    description: '사용자의 웹 푸시 구독 정보를 저장합니다.',
  })
  @ApiResponse({ status: 201, description: '구독 성공' })
  async subscribe(
    @CurrentUser() user: any,
    @Body() subscription: PushSubscriptionInterface,
  ) {
    await this.webpushService.subscribe(user.id, subscription);
  }

  @ApiExcludeEndpoint()
  @Post('send-notification')
  sendNotification(
    @CurrentUser() user: any,
    @Body()
    payload: {
      title: string;
      body: string;
      options?: PushNotificationOptions;
    },
  ): Promise<void> {
    console.log('send-noti');
    return this.webpushService.testSendNotification();
  }

  @Post('unsubscribe')
  @ApiOperation({
    summary: '웹 푸시 구독 해제',
    description: '사용자의 웹 푸시 구독을 해제합니다.',
  })
  @ApiBody({
    type:'string',
    description:'웹푸시 엔드포인트',
  })
  @ApiResponse({ status: 200, description: '구독 해제 성공' })
  async unsubscribe(
    @CurrentUser() user: any,
    @Body('endpoint') endpoint: string,
  ): Promise<void> {
    if (!endpoint) {
      throw new BadRequestException('Endpoint is required.');
    }
    await this.webpushService.unsubscribe(user.id, endpoint);
  }

  @Get('status')
  async getStatus(@CurrentUser() user: any, @Query('endpoint') endpoint: string) {
    return await this.webpushService.getSubscriptionStatus(user.id, endpoint);
  }
}