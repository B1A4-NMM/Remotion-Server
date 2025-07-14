import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiBearerAuth,
  ApiOperation, ApiExcludeEndpoint, ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { StrengthService } from './strength.service';
import { GetStrengthsResponseDto } from './dto/get-strengths-response.dto';
import { ParseLocalDatePipe } from '../pipe/parse-local-date.pipe';
import { LocalDate } from 'js-joda';

@ApiTags('강점')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('strength')
export class StrengthController {
  constructor(private readonly strengthService: StrengthService) {}

  @Get()
  @ApiOperation({ summary: '회원의 강점 통계 요약 반환' })
  @ApiOkResponse({ type: GetStrengthsResponseDto })
  async getUserStrengths(
    @CurrentUser() user,
  ): Promise<GetStrengthsResponseDto> {
    return this.strengthService.getStrengthsSummaryByMember(user.id);
  }

  @Get('period')
  @ApiOperation({ summary: '연도와 월로 강점 조회' })
  @ApiOkResponse({ type: GetStrengthsResponseDto })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  async getUserStrengthByYearMonth(
    @CurrentUser() user,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.strengthService.getStrengthsCountByMonth(user.id, year, month);
  }

  @Get('date')
  @ApiExcludeEndpoint()
  async getUserStrengthByPeriod(
    @CurrentUser() user,
    @Query('startDate', ParseLocalDatePipe) startDate: LocalDate,
    @Query('endDate', ParseLocalDatePipe) endDate: LocalDate,
  ) {
    return this.strengthService.getStrengthsCountByPeriod(
      user.id,
      startDate,
      endDate,
    );
  }
}
