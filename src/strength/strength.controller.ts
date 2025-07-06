import { StrengthService } from './strength.service';
import { Body, Controller, Injectable, Post, Patch ,UseGuards, Get, Logger, Query, Param, Delete } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';



@Controller('strength')
@UseGuards(AuthGuard('jwt'))
export class StrengthController {
  constructor(private readonly strengthService: StrengthService) {}


  @Get()
  async getUserStrengths(@CurrentUser() user){
    return this.strengthService.getStrengthsSummaryByMember(user.id);
  }
}
