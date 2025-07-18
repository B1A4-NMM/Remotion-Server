import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { WebpushService } from './webpush.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';

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
export class WebpushController {
  constructor(private readonly webpushService: WebpushService) {}

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  async subscribe(@CurrentUser()user:any ,@Body() subscription: PushSubscriptionInterface){
    await this.webpushService.subscribe(user.id,subscription);
  }

  @Post('send-notification')
  @UseGuards(AuthGuard('jwt'))
  sendNotification(
    @CurrentUser() user: any,
    @Body() payload: {
      title: string;
      body: string;
      options?: PushNotificationOptions;
    }
  ): Promise<void> {
    console.log("send-noti")
    return this.webpushService.testSendNotification(user.id);
  }

  @Post('unsubscribe')
  @UseGuards(AuthGuard('jwt'))
  async unsubscribe(
    @CurrentUser() user: any,
    @Body('endpoint') endpoint: string,
  ): Promise<void> {
    if (!endpoint) {
      throw new BadRequestException('Endpoint is required.');
    }
    await this.webpushService.unsubscribe(user.id, endpoint);
  }
}