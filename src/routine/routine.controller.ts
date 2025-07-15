import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoutineService } from './routine.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { RoutineEnum } from '../enums/routine.enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoutineRes } from './dto/routine.res';
import { RecommendRoutineRes } from './dto/recommend-routine.res';

@Controller('routine')
@ApiTags('루틴')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Get('stress')
  @ApiOperation({
    summary: '스트레스 관리 루틴 조회',
    description: '사용자의 스트레스 관리 루틴을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 조회 성공',
    type: [RoutineRes],
  })
  async getAngerRoutine(@CurrentUser() user: any) {
    const memberId: string = user.id;
    return this.routineService.getRoutine(memberId, RoutineEnum.STRESS);
  }

  @Post('stress')
  @ApiOperation({
    summary: '스트레스 관리 루틴 생성',
    description: '사용자의 스트레스 관리 루틴을 생성합니다.',
  })
  @ApiBody({ type: String, description: '루틴 내용' })
  @ApiResponse({ status: 201, description: '루틴 생성 성공', type: RoutineRes })
  async createAngerRoutine(
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    const memberId: string = user.id;
    return this.routineService.createRoutine(
      memberId,
      RoutineEnum.STRESS,
      content,
    );
  }

  @Get('anxiety')
  @ApiOperation({
    summary: '불안 관리 루틴 조회',
    description: '사용자의 불안 관리 루틴을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 조회 성공',
    type: [RoutineRes],
  })
  async getNervousRoutine(@CurrentUser() user: any) {
    const memberId: string = user.id;
    return this.routineService.getRoutine(memberId, RoutineEnum.ANXIETY);
  }

  @Post('anxiety')
  @ApiOperation({
    summary: '불안 관리 루틴 생성',
    description: '사용자의 불안 관리 루틴을 생성합니다.',
  })
  @ApiBody({ type: String, description: '루틴 내용' })
  @ApiResponse({ status: 201, description: '루틴 생성 성공', type: RoutineRes })
  async createNervousRoutine(
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    const memberId: string = user.id;
    return this.routineService.createRoutine(
      memberId,
      RoutineEnum.ANXIETY,
      content,
    );
  }

  @Get('depression')
  @ApiOperation({
    summary: '우울 관리 루틴 조회',
    description: '사용자의 우울 관리 루틴을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 조회 성공',
    type: [RoutineRes],
  })
  async getDepressionRoutine(@CurrentUser() user: any) {
    const memberId: string = user.id;
    return this.routineService.getRoutine(memberId, RoutineEnum.DEPRESSION);
  }

  @Post('depression')
  @ApiOperation({
    summary: '우울 관리 루틴 생성',
    description: '사용자의 우울 관리 루틴을 생성합니다.',
  })
  @ApiBody({ type: String, description: '루틴 내용' })
  @ApiResponse({ status: 201, description: '루틴 생성 성공', type: RoutineRes })
  async createDepressionRoutine(
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    const memberId: string = user.id;
    return this.routineService.createRoutine(
      memberId,
      RoutineEnum.DEPRESSION,
      content,
    );
  }

  @Get('recommend')
  @ApiOperation({
    summary: '추천 루틴 조회',
    description: '다이어리의 감정 분석을 바탕으로 루틴을 추천합니다.',
  })
  @ApiQuery({
    name: 'diaryId',
    required: true,
    type: Number,
    description: '루틴을 추천받을 다이어리 아이디',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 추천 성공',
    type: RecommendRoutineRes,
  })
  async getRecommendRoutine(
    @CurrentUser() user: any,
    @Query('diaryId', ParseIntPipe) diaryId: number,
  ) {
    const memberId: string = user.id;
    return this.routineService.getRecommendRoutine(memberId, diaryId);
  }

  @Get('trigger')
  @ApiOperation({
    summary: '루틴 트리거 조회',
    description:
      '사용자의 루틴 트리거를 조회합니다. 이 트리거는 루틴 폴더에는 추가되지 않았습니다',
  })
  @ApiResponse({
    status: 200,
    description: '트리거 조회 성공',
    type: [RoutineRes],
  })
  async getTrigger(@CurrentUser() user: any) {
    const memberId: string = user.id;
    return this.routineService.getTrigger(memberId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '루틴 트리거 토글',
    description: '트리거를 토글하여 폴더에서 추가하거나 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '루틴 ID',
  })
  @ApiResponse({
    status: 200,
    description: '트리거 토글 성공',
    schema: {
      properties: {
        id: {
          type: 'number',
          example: 1,
          description: '토글된 루틴의 ID',
        },
        isTrigger: {
          type: 'boolean',
          example: false,
          description: '토글된 이후 루틴의 상태',
        },
      },
    },
  })
  async toggleTrigger(@CurrentUser() user: any, @Param('id') id: string) {
    const memberId: string = user.id;
    const trigger = await this.routineService.toggleTrigger(+id);
    return { id: trigger.id, isTrigger: trigger.isTrigger };
  }

  @Delete(':id')
  @ApiOperation({
    summary: '루틴 삭제',
    description: '사용자의 루틴을 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: '삭제할 루틴 ID',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 삭제 성공',
  })
  async deleteRoutine(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const memberId: string = user.id;
    return await this.routineService.deleteRoutine(memberId, id);
  }
}
