import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MapService } from './map.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DiaryMapRes } from './dto/diary-map.res';

@ApiTags('지도')
@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '지도에 표시할 일기 목록 조회',
    description: '사용자의 위치 정보가 있는 일기 목록을 조회합니다.',
  })
  @ApiResponse({ type: DiaryMapRes ,status: 200, description: '일기 목록 조회 성공' })
  findAll(@CurrentUser() user: any) {
    const memberId = user.id;

    return this.mapService.findAllDiaryForMap(memberId);
  }
}
