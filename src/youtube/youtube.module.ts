import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { YoutubeService } from './youtube.service';
import { YoutubeApi } from '../entities/YoutubeApi.entity';
import { YoutubeController } from './youtube.controller'; // YoutubeController 임포트 추가

@Module({
  imports: [
    TypeOrmModule.forFeature([YoutubeApi]),
    ScheduleModule.forRoot(), // 스케줄링 모듈 초기화
    HttpModule, // HTTP 요청을 위한 모듈
  ],
  controllers: [YoutubeController], // YoutubeController 추가
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}