import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationEntity } from '../entities/notification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberModule } from '../member/member.module';
import { WebpushModule } from '../webpush/webpush.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    MemberModule,
    WebpushModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
