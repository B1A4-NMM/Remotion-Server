// 

import { StrengthService } from './strength.service';
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';

@ApiTags('Strengths')
@UseGuards(AuthGuard('jwt'))
@Controller('strength')
export class StrengthController {
  constructor(private readonly strengthService: StrengthService) {}

  @Get()
  @ApiOperation({ summary: '회원의 VIA 강점 요약 반환' })
  @ApiOkResponse({
    description: '강점 요약 (유형별, 세부 강점별)',
    schema: {
      type: 'object',
      properties: {
        typeCount: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: {
            지혜: 3,
            용기: 3,
            인애: 2,
          },
        },
        detailCount: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: {
            창의성: 1,
            끈기: 2,
            유머: 1,
          },
        },
      },
    },
  })
  async getUserStrengths(@CurrentUser() user) {
    return this.strengthService.getStrengthsSummaryByMember(user.id);
  }
}
