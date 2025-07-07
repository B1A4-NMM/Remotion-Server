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
import { CharacterResponseDto } from './dto/member-character-response.dto';

import { ApiExcludeController, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MemberSummaryService } from './member-summary.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/user.decorator';
import { MemberSummaryRes } from './dto/member-summary.res';
import { EmotionService } from '../emotion/emotion.service';
import { EmotionSummaryWeekdayRes } from './dto/emotion-summary-weekday.res';
import { AchievementService } from '../achievement-cluster/achievement.service';
import { EmotionBaseAnalysisResponseDto } from 'src/emotion/dto/emotion-base-analysis.dto';
import { MemberCharacterService } from './member-character.service';


@Controller('member')
@ApiTags('사용자/회원')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly memberSummaryService: MemberSummaryService,
    private readonly emotionService: EmotionService,
    private readonly memberCharacterService : MemberCharacterService,
  ) {

  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: '회원 감정 요약 정보 조회',
    type: MemberSummaryRes,
  })
  @ApiOperation({
    summary: '사용자 감정 요약 정보',
    description:
      '기간별 회원의 감정 요약 정보를 조회합니다, 감정은 활력, 안정, 유대, 불안, 스트레스, 우울 등으로 나뉩니다',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    type: Number,
    description: '조회할 기간(일), 기본값: 7',
  })
  @ApiResponse({ status: 200, description: '회원 감정 요약 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMemberSummaryPeriod(
    @CurrentUser() user: any,
    @Query('period') period: number = 7,
  ) {
    const memberId = user.id;
    return this.memberSummaryService.findMemberSummaryByPeriod(
      memberId,
      period,
    );
  }

  @Get('emotion/weekday')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '요일별 감정 요약',
    description: '기간 내 요일별로 등장한 감정들의 빈도를 조회합니다',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    type: Number,
    description: '조회할 기간(일), 기본값: 7',
  })
  @ApiResponse({
    type: EmotionSummaryWeekdayRes
  })
  @ApiResponse({
    status: 200,
    description: '요일별 감정 빈도 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getWeekdayEmotion(
    @CurrentUser() user: any,
    @Query('period') period: number = 7,
  ) {
    const memberId = user.id;
    return await this.emotionService.getEmotionSummaryWeekDay(memberId, period);
  }
  
 
  // about-me 감정 base 3가지 데이터 조회 및 전송 로직

  @Get('emotion/base-analysis')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '요일별 감정 요약',
    description: '기간 내 요일별로 등장한 감정들의 빈도를 조회합니다',
  })
  @ApiOperation({
    summary: 'EmotionBase 별 감정 분석 조회',
    description: '회원의 감정을 Relation, Self, State 세 가지 감정 베이스로 나누어 각각에 속한 감정들의 intensity와 count를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'EmotionBase별 감정 분석 성공',
    type: EmotionBaseAnalysisResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getEmotionBaseAnalysis(@CurrentUser() user : any ) {
    return await this.emotionService.getEmotionBaseAnalysis(user.id);
  }

  @Get('character')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '사용자 캐릭터 조회', description: 'EmotionBase 기반 감정 분석으로 캐릭터를 분류해 반환합니다.' })
  @ApiResponse({ status: 200, description: '캐릭터 분석 결과', type: CharacterResponseDto })
  async getCharacter(@CurrentUser() user: any,): Promise<CharacterResponseDto> {
    const memberId = user.id;
    return await this.memberCharacterService.getMemberCharacter(memberId);
}

  


}
