import { Controller, Get, ParseEnumPipe, Query, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { EmotionGroup } from '../enums/emotion-type.enum';
import { EmotionService } from './emotion.service';
import { ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { EmotionAnalysisPeriodRes } from './dto/emotion-analysis-period.res';

import { EmotionSummaryByTargetResponseDto } from './dto/emotion-summary-by-target.res.dto';
import { ActivityEmotionSummaryRes } from './dto/activity-emotion-summary.res';

@Controller('emotion')
@ApiTags('감정')
export class EmotionController {

  constructor(private  readonly service: EmotionService) {
  }

  @Get('target/:targetId')
  @ApiOperation({ summary: '대상별 감정 요약 조회', description: '특정 대상과 관련된 감정을 날짜별로 요약하여 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공적으로 조회했을 경우', type: [EmotionSummaryByTargetResponseDto] })
  async getEmotionSummaryByTarget(@Param('targetId', ParseIntPipe) targetId: number) {
    return this.service.getEmotionSummaryByTarget(targetId);
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

    const label = `emotion-analysis-${user.id}-${Date.now()}`;
    console.time(label);

    try {
      const result = await this.service.getEmotionAnalysis(memberId, period, emotion);
      console.timeEnd(label);
      return result;
    } catch (e) {
      console.timeEnd(label); // 혹시 모를 예외 대비
      throw e;
    }
  }

  @Get('activity/negative')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    schema:{
      type: 'object',
      properties: {
        stress: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        depression: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        anxiety: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
      }
    }
  })
  @ApiQuery({ name: 'period', type: Number, required: true, description: '조회할 기간(일 단위)' })
  async getNegativeActivities(@CurrentUser() user:any, @Query('period', ParseIntPipe) period:number){
    const memberId:string = user.id;
    return await this.service.getNegativeActivities(memberId, period);
  }

  @Get('activity/positive')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    schema:{
      type: 'object',
      properties: {
        stability: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        bond: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        vitality: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
      }
    }
  })
  @ApiQuery({ name: 'period', type: Number, required: true, description: '조회할 기간(일 단위)' })
  async getPositiveActivities(@CurrentUser() user:any, @Query('period', ParseIntPipe) period:number){
    const memberId:string = user.id;
    return await this.service.getPositiveActivities(memberId, period);
  }

  @Get('negative')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    schema:{
      type: 'object',
      properties: {
        stress: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        depression: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        anxiety: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
      }
    }
  })
  @ApiQuery({ name: 'period', type: Number, required: true, description: '조회할 기간(일 단위)' })
  async getNegativeEmotionTargetAndSummary(@CurrentUser() user:any, @Query('period', ParseIntPipe) period:number){
    const memberId:string = user.id;
    return await this.service.getNegativeEmotionsTargetAndSummary(memberId, period);
  }

  @Get('positive')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    schema:{
      type: 'object',
      properties: {
        stability: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        bond: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
        vitality: {
          type: 'array',
          items: { $ref: getSchemaPath(ActivityEmotionSummaryRes) },
        },
      }
    }
  })
  @ApiQuery({ name: 'period', type: Number, required: true, description: '조회할 기간(일 단위)' })
  async getPositiveEmotionTargetAndSummary(@CurrentUser() user:any, @Query('period', ParseIntPipe) period:number){
    const memberId:string = user.id;
    return await this.service.getPositiveEmotionsTargetAndSummary(memberId, period);
  }

}
