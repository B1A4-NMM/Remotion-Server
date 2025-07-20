import { LocalDate, LocalDateTime } from 'js-joda';
import { NotificationType } from '../../enums/notification-type.enum';
import { NotificationEntity } from '../../entities/notification.entity';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationRes {
  @ApiProperty({ description: '알림 ID' })
  id: number;

  @ApiProperty({ description: '알림 내용' })
  content: string;

  @ApiProperty({ description: '읽음 여부' })
  read: boolean;

  @ApiProperty({ description: '생성 날짜' })
  createdAt: LocalDateTime;

  @ApiProperty({ description: '알림 타입', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: '사진 경로', nullable: true })
  photoPath?: string | null;

  @ApiProperty({ description: '일기 ID', nullable: true })
  diaryId?: number | null;

  @ApiProperty({ description: '연관된 날짜', nullable: true })
  targetDate?: LocalDate | null;

  constructor(notification: NotificationEntity) {
    this.id = notification.id;
    this.content = notification.content;
    this.read = notification.isRead;
    this.createdAt = notification.createDate;
    this.type = notification.type;
    this.photoPath = notification.photoPath;
    this.diaryId = notification.diaryId;
    this.targetDate = notification.targetDate;
  }
}
