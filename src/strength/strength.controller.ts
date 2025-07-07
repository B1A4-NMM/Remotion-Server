import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { StrengthService } from './strength.service';
import { GetStrengthsResponseDto } from './dto/get-strengths-response.dto';

@ApiTags('Strengths')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('strength')
export class StrengthController {
  constructor(private readonly strengthService: StrengthService) {}

  @Get()
  @ApiOperation({ summary: '회원의 강점 통계 요약 반환' })
  @ApiOkResponse({ type: GetStrengthsResponseDto })
  async getUserStrengths(@CurrentUser() user): Promise<GetStrengthsResponseDto> {
    return this.strengthService.getStrengthsSummaryByMember(user.id);
  }
}
