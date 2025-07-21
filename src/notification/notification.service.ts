import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '../enums/notification-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { MemberService } from '../member/member.service';
import { WebpushService } from '../webpush/webpush.service';
import { LocalDate, LocalDateTime } from 'js-joda';
import { NotificationRes } from './dto/notification.res';
import {
  changeCharacterMessage,
  recapMessage,
  ROUTINE_MESSAGE,
  TODO_MESSAGE,
} from '../constants/noti-message.constants';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    private readonly memberService: MemberService,
    private readonly webpushService: WebpushService,
  ) {}

  /**
   * 알림을 읽음 처리합니다
   * @param memberId
   * @param notificationId
   */
  async readNotification(memberId: string, notificationId: number) {
    const entity = await this.notificationRepo.findOne({
      where: {
        author: { id: memberId },
        id: notificationId,
      },
    });

    if (entity === null) {
      throw new NotFoundException('해당 알림이 없습니다');
    }

    entity.isRead = true;
    await this.notificationRepo.save(entity);
  }

  /**
   * 회원이 읽지 않은 알림을 조회합니다
   * @param memberId
   */
  async getNotificationNoRead(memberId: string) {
    const result = await this.notificationRepo.find({
      where: {
        author: { id: memberId },
        isRead: false,
      },
      order: {
        createDate: 'DESC',
      },
    });

    return result.map((n) => {
      return new NotificationRes(n);
    });
  }

  /**
   * 회원의 모든 알림을 조회합니다
   * @param memberId
   */
  async getNotificationAll(memberId: string) {
    const result = await this.notificationRepo.find({
      where: {
        author: { id: memberId },
      },
      order: {
        createDate: 'DESC',
      },
    });

    return result.map((n) => {
      return new NotificationRes(n);
    });
  }

  /**
   * 오늘의 추천 코멘트를 제작합니다
   * @param memberId
   * @param comment
   * @param diaryId
   */
  async createRecommendNotification(
    memberId: string,
    comment: string,
    diaryId: number,
  ) {
    return this.createNotification(
      memberId,
      comment,
      NotificationType.TODAY_COMMENT,
      diaryId,
      null,
      null,
    );
  }

  /**
   * 루틴 알림을 제작합니다
   * @param memberId
   */
  async createRoutineNotification(memberId: string) {
    return this.createNotification(
      memberId,
      ROUTINE_MESSAGE,
      NotificationType.ROUTINE,
      null,
      null,
      null,
    );
  }

  /**
   * 리캡 알림을 제작합니다
   * @param memberId
   * @param diaryId
   */
  async createRecapNotification(memberId: string, diaryId: number) {
    return this.createNotification(
      memberId,
      recapMessage(),
      NotificationType.RECAP,
      diaryId,
      null,
      null,
    );
  }

  /**
   * 캐릭터 변경 알림을 제작합니다
   * @param memberId
   */
  async createCharacterNotification(memberId: string) {
    return this.createNotification(
      memberId,
      changeCharacterMessage(),
      NotificationType.CHARACTER,
      null,
      null,
      null,
    );
  }

  /**
   * todo 알림을 제작합니다
   * @param memberId
   * @param targetDate
   */
  async createTodoNotification(memberId: string, targetDate: LocalDate) {
    return this.createNotification(
      memberId,
      TODO_MESSAGE,
      NotificationType.TODO,
      null,
      null,
      targetDate,
    );
  }

  async createTestNotification(
    memberId: string,
    content: string,
    type: NotificationType,
    diaryId?: number | null,
    photoPath?: string | null,
    targetDate?: LocalDate | null,
  ) {
    let entity = new NotificationEntity();
    entity.author = await this.memberService.findOne(memberId);
    entity.photoPath = photoPath;
    entity.content = content;
    entity.type = type;
    entity.createDate = LocalDateTime.now();
    entity.isRead = false;
    entity.diaryId = diaryId;
    entity.targetDate = targetDate;
    await this.notificationRepo.save(entity);
  }

  /**
   * 알림을 만듭니다. webPush 또한 같이 전달합니다
   * @param memberId
   * @param content
   * @param type
   * @param diaryId
   * @param photoPath
   * @param targetDate
   */
  async createNotification(
    memberId: string,
    content: string,
    type: NotificationType,
    diaryId?: number | null,
    photoPath?: string | null,
    targetDate?: LocalDate | null,
  ) {
    let entity = new NotificationEntity();
    entity.author = await this.memberService.findOne(memberId);
    entity.photoPath = photoPath;
    entity.content = content;
    entity.type = type;
    entity.createDate = LocalDateTime.now();
    entity.isRead = false;
    entity.diaryId = diaryId;
    entity.targetDate = targetDate;

    await this.sendWebPush(memberId, content, type, photoPath);
    await this.notificationRepo.save(entity);
  }

  /**
   * webPush 알람을 전달합니다
   * @param memberId
   * @param content
   * @param type
   * @param photoPath
   * @private
   */
  private async sendWebPush(
    memberId: string,
    content: string,
    type: NotificationType,
    photoPath?: string | null,
  ) {
    let title = '';
    switch (type) {
      case NotificationType.CHARACTER:
        title = '캐릭터 변경!!';
        break;
      case NotificationType.RECAP:
        title = '옛날 일기 둘러보기';
        break;
      case NotificationType.ROUTINE:
        title = '나의 기분전환 루틴 추가';
        break;
      case NotificationType.TODO:
        title = 'TODO 완료 하셨나요?';
        break;
    }

    if (photoPath === null) {
      await this.webpushService.sendNotification(
        memberId,
        title,
        content,
        WEBPUSH_ICON_PATH,
      );
    } else {
      await this.webpushService.sendNotification(
        memberId,
        title,
        content,
        WEBPUSH_ICON_PATH,
        photoPath,
      );
    }
  }

  /**
   * 현재 읽지않은 알림의 갯수를 반환합니다
   */
  async getNoReadNotificationCount(memberId: string) {
    const result = await this.notificationRepo.find({
      where: {
        author: { id: memberId },
        isRead: false,
      },
      select: ['id'],
    });

    return result.length;
  }

  @Cron('3 16 * * *')
  async testNotification() {
    const members = await this.memberService.findAll();
    members.map((m) => {
      this.createNotification(
        m.id,
        '테스트 메세지입니다',
        NotificationType.RECAP,
        null,
        null,
        null,
      );
    });
  }
}
