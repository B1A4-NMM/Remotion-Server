import { Injectable } from '@nestjs/common';
import { NotificationType } from '../enums/notification-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { MemberService } from '../member/member.service';
import { WebpushService } from '../webpush/webpush.service';
import { LocalDate } from 'js-joda';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    private readonly memberService: MemberService,
    private readonly webpushService: WebpushService,
  ) {}

  async createNotification(
    memberId: string,
    content: string,
    type: NotificationType,
    diaryId?:number,
    photoPath?: string | null,
  ) {
    let entity = new NotificationEntity();
    entity.author = await this.memberService.findOne(memberId);
    entity.photoPath = photoPath;
    entity.content = content;
    entity.type = type;
    entity.createDate = LocalDate.now()
    entity.isRead = false;
    entity.diaryId = diaryId;

    await this.sendWebPush(memberId, content, type, photoPath);
    await this.notificationRepo.save(entity);
  }

  private async sendWebPush(memberId:string, content:string, type:NotificationType, photoPath?:string | null) {

    let title = ''
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
        title = "TODO 완료 하셨나요?"
        break
    }

    if (photoPath === null) {
      await this.webpushService.sendNotification(
        memberId,
        title,
        content,
        './static/harudew_logo.png'
      )
    }else{
      await this.webpushService.sendNotification(
        memberId,
        title,
        content,
        './static/harudew_logo.png',
        photoPath
      )
    }

  }


}
