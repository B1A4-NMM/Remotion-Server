import { Module } from '@nestjs/common';
import { TargetService } from './target.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Target } from '../entities/Target.entity';
import { MemberModule } from '../member/member.module';
import { DiaryTarget } from '../entities/diary-target.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Target, DiaryTarget]), MemberModule],
  providers: [TargetService],
  exports: [TargetService]
})
export class TargetModule {}
