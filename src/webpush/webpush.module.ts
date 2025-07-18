import { Module } from '@nestjs/common';
import { WebpushController } from './webpush.controller';
import { WebpushService } from './webpush.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from '../entities/push-subscription.entity';
import { Member } from '../entities/Member.entity';
import { MemberService } from '../member/member.service';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscription,]),
    MemberModule
  ],
  controllers: [WebpushController],
  providers: [WebpushService],
})
export class WebpushModule {}