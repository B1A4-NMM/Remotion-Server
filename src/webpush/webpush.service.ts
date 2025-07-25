import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import {
  PushNotificationOptions,
  PushSubscriptionInterface,
} from './webpush.controller';
import { InjectRepository } from '@nestjs/typeorm';
import { PushSubscription } from '../entities/push-subscription.entity';
import { Repository } from 'typeorm';
import { Member } from '../entities/Member.entity';
import { MemberService } from '../member/member.service';

@Injectable()
export class WebpushService {
  private readonly logger = new Logger(WebpushService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(PushSubscription)
    private readonly pushRepo: Repository<PushSubscription>,
    private readonly memberService: MemberService,
  ) {
    webpush.setVapidDetails(
      this.configService.get<string>('VAPID_EMAIL'),
      this.configService.get<string>('VAPID_PUBLIC_KEY'),
      this.configService.get<string>('VAPID_PRIVATE_KEY'),
    );
  }

  /**
   * 멤버 ID와 pushSubscription 정보를 받아 데이터베이스에 저장
   */
  async subscribe(memberId: string, subscription: PushSubscriptionInterface) {
    this.logger.log(`subscribe memberId:${memberId}`);
    await this.saveOrFlagOnPushSubscription(memberId, subscription);

    return 'Subscription successful';
  }

  /**
   * 멤버의 브라우저의 알림 정보를 해제합니다
   */
  async unsubscribe(memberId: string, endpoint: string) {
    this.logger.log(`unsubscribe memberId:${memberId}`);
    const subscribe = await this.pushRepo.findOne({
      where: {
        author: { id: memberId },
        endpoint: endpoint,
      },
    });

    if (subscribe === null) {
      this.logger.error(
        `해당 구독 정보를 찾을수 없습니다 !! memberId:${memberId}, endpoint:${endpoint}`,
      );
      return;
    }

    subscribe.isSubscribed = false;
    await this.pushRepo.save(subscribe);
  }

  /**
   * 테스트해보기 
   */
  async testSendNotification() { // memberId 파라미터 제거
    let options: PushNotificationOptions = {};
    options.icon =
      'https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png';
    options.image = 'https://picsum.photos/400/200';
    options.actions = [
      {
        action: 'hi',
        title: 'action 1',
        icon: 'https://www.google.com/favicon.ico',
      },
      {
        action: 'hi2',
        title: 'action 2',
        icon: 'https://www.google.com/favicon.ico',
      },
    ];

    const allActiveSubscriptions = await this.pushRepo.find({
      where: {
        isSubscribed: true,
      },
      relations: ['author'], // author 정보를 로드하여 unsubscribe 시 사용
    });

    const payload = this.createPayload(
      '테스트 메세지 제목',
      '테스트 메세지 body',
      options.icon,
      options.image,
      // options.actions // actions도 payload에 포함
    );

    for (const sub of allActiveSubscriptions) {
      const webpushSubscription = {
        endpoint: sub.endpoint,
        expirationTime: null,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      try {
        await webpush.sendNotification(webpushSubscription, payload);
        this.logger.log('Notification sent successfully to endpoint:', sub.endpoint);
      } catch (error) {
        this.logger.error('Error sending notification to endpoint:', sub.endpoint, error);
        // 구독이 더 이상 유효하지 않은 경우 (예: 410 Gone) 구독 해제
        if (error.statusCode === 410) {
          this.logger.warn(`Subscription for endpoint ${sub.endpoint} is no longer valid. Unsubscribing.`);
          if (sub.author && sub.author.id) {
            await this.unsubscribe(sub.author.id, sub.endpoint);
          } else {
            this.logger.error(`Could not unsubscribe for endpoint ${sub.endpoint}: author information missing.`);
          }
        }
      }
    }
  }

  /**
   * 멤버 ID를 받아 해당 멤버가 구독중인 모든 브라우저에 알림 날리기
   */
  async sendNotification(
    memberId: string,
    title: string,
    body: string,
    iconPath: string,
    imagePath?: string,
    actions?: { action: string; title: string; icon: string }[],
  ): Promise<void> {
    const payload = this.createPayload(title, body, iconPath, imagePath, actions);

    const subscriptions = await this.findPushSubscriptions(memberId);

    for (const sub of subscriptions) {
      const webpushSubscription = {
        endpoint: sub.endpoint,
        expirationTime: null, // Assuming no expiration time is stored or needed for this example
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      try {
        await webpush.sendNotification(webpushSubscription, payload);
        this.logger.log('Notification sent successfully');
      } catch (error) {
        this.logger.error('Error sending notification:', error);
        // If the subscription is no longer valid, you might want to remove it from the database
        // For example: if (error.statusCode === 410) { await this.unsubscribe(memberId, sub.endpoint); }
        if (error.statusCode === 410) { await this.unsubscribe(memberId, sub.endpoint); }
        throw error;
      }
    }
  }

  /**
   * 푸시 메세지 페이로드 제작
   */
  private createPayload(
    title: string,
    body: string,
    icon: string,
    image?: string,
    actions?: { action: string; title: string; icon: string }[],
  ) {
    const payload = JSON.stringify({
      title: title,
      body: body,
      options: {
        icon: icon,
        image: image,
        actions: actions,
      },
    });
    return payload;
  }

  /**
   * pushSubscription을 찾아서 없다면 생성하고, 구독 상태를 true로 만들기
   */
  private async saveOrFlagOnPushSubscription(
    memberId: string,
    subscription: PushSubscriptionInterface,
  ) {
    let entity = await this.pushRepo.findOne({
      where: {
        author: { id: memberId },
        endpoint: subscription.endpoint,
      },
    });

    if (entity === null) {
      const author = await this.memberService.findOne(memberId);
      entity = PushSubscription.fromInterface(subscription, author);
      entity = await this.pushRepo.save(entity);
    }

    entity.isSubscribed = true;
    await this.pushRepo.save(entity);
  }

  /**
   * memberId를 파라미터로 받아서 flag가 켜져있는 모든 구독정보 가져오기
   */
  private async findPushSubscriptions(memberId: string) {
    return await this.pushRepo.find({
      where: {
        author: { id: memberId },
        isSubscribed: true,
      },
    });
  }

  /**
   * 현재 멤버의 현재 브라우저의 구독 상태 알려주기
   */
  async getSubscriptionStatus(
    memberId: string,
    endpoint: string,
  ): Promise<{ isSubscribed: boolean }> {

    const subscription = await this.pushRepo.findOne({
      where: {
        author: { id: memberId },
        endpoint: endpoint,
      },
    });
    const isSubscribed = subscription ? subscription.isSubscribed : false;
    // isSubscribed 플래그가 있다면 사용하고, 없다면 unsubscribedAt이 null인지 확인
    return { isSubscribed };
  }
}
