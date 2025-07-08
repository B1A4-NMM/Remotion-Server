import { Controller, Get, ParseEnumPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { EmotionGroup } from '../enums/emotion-type.enum';
import { EmotionService } from './emotion.service';
import { ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmotionAnalysisPeriodRes } from './dto/emotion-analysis-period.res';

@Controller('emotion')
@ApiTags('감정')
export class EmotionController {

  constructor(private  readonly service: EmotionService) {
  }

  @Get('activity')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('jwt'))
  async getActivity(
    @CurrentUser() user:any,
    @Query('emotion', new ParseEnumPipe(EmotionGroup)) emotion: EmotionGroup,
    @Query('period') period: number,
  ) {
    const memberId = user.id;

    return this.service.getActivityEmotionSummaryByPeriodAndEmotionGroup(memberId, period, emotion)
  }

  @Get('date')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('jwt'))
  async getDate(
    @CurrentUser() user:any,
    @Query('emotion', new ParseEnumPipe(EmotionGroup)) emotion: EmotionGroup,
    @Query('period') period: number,
  ) {
    const memberId = user.id;

    return this.service.getEmotionSummaryPeriodByEmotionGroup(memberId, period, emotion)
  }

  @Get('people')
  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard('jwt'))
  async getPeople(
    @CurrentUser() user:any,
    @Query('emotion', new ParseEnumPipe(EmotionGroup)) emotion: EmotionGroup,
    @Query('period') period: number,
  ) {
    const memberId = user.id;

    return this.service.getTargetEmotionSummaryByPeriodAndEmotionGroup(memberId, period, emotion)
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '전체 감정 분석 데이터 조회', description: '활동, 날짜, 대상별 감정 분석 데이터를 모두 조회합니다.' })
  @ApiQuery({ name: 'emotion', enum: EmotionGroup, required: true, description: '조회할 감정 그룹' })
  @ApiQuery({ name: 'period', type: Number, required: true, description: '조회할 기간(일 단위)' })
  @ApiResponse({
    type: EmotionAnalysisPeriodRes,
  })
  async getAll(
    @CurrentUser() user: any,
    @Query('emotion', new ParseEnumPipe(EmotionGroup)) emotion: EmotionGroup,
    @Query('period') period: number,
  ) {
    const memberId = user.id;

    return this.service.getEmotionAnalysis(memberId, period, emotion);
  }


}
