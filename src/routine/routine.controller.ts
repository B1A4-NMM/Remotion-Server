import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RoutineService } from './routine.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { RoutineEnum } from '../enums/routine.enum';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { RoutineRes } from './dto/routine.res';


@Controller('routine')
@UseGuards(AuthGuard('jwt'))
@ApiTags('routine')
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer {JWT token}',
})
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Get('anger')
  @ApiOperation({
    summary: '분노 관리 루틴 조회',
    description: '사용자의 분노 관리 루틴을 조회합니다.',
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

  @Post('anger')
  @ApiOperation({
    summary: '분노 관리 루틴 생성',
    description: '사용자의 분노 관리 루틴을 생성합니다.',
  })
  @ApiBody({ type: String, description: '루틴 내용' })
  @ApiResponse({ status: 201, description: '루틴 생성 성공', type: RoutineRes })
  async createAngerRoutine(
    @CurrentUser() user: any,
    @Body('content') content: string,
  ) {
    const memberId: string = user.id;
    return this.routineService.createRoutine(memberId, RoutineEnum.STRESS, content);
  }

  @Get('nervous')
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

  @Post('nervous')
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
    return this.routineService.createRoutine(memberId, RoutineEnum.ANXIETY, content);
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
    return this.routineService.createRoutine(memberId, RoutineEnum.DEPRESSION, content);
  }
}
