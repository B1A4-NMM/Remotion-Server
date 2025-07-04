import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards, Query,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ApiExcludeController } from '@nestjs/swagger';
import { MemberSummaryService } from './member-summary.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';

@ApiExcludeController()
@Controller('member')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly memberSummaryService: MemberSummaryService,
  ) {}

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  async getMemberSummaryPeriod(
    @CurrentUser() user:any,
    @Query('period') period: number = 7,
  ) {
    const memberId = user.id;
    return this.memberSummaryService.findMemberSummaryByPeriod(memberId, period);
  }
}
