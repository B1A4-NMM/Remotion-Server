import { Module } from '@nestjs/common';
import { MapService } from './map.service';
import { MapController } from './map.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from '../entities/Diary.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Diary])],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
