import { Module } from '@nestjs/common';
import { RoutineService } from './routine.service';
import { RoutineController } from './routine.controller';
import { Routine } from '../entities/rotine.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [TypeOrmModule.forFeature([Routine]), MemberModule],
  controllers: [RoutineController],
  providers: [RoutineService],
})
export class RoutineModule {}
