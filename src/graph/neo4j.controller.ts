import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { SocialType } from '../enums/social-type.enum';
import { SubjectType } from '../enums/subject-type.enum';
import { AnalysisService } from '../analysis/analysis.service';
import { MemberGraphService } from './member/member.graph.service';
import { SubjectGraphService } from 'src/graph/subject/subject.graph.service';
import { CreateMemberGraphDto } from './member/dto/create-member.graph.dto';
import { CreateSubjectDto } from './subject/dto/create-subject.dto';
import { ApiExcludeController } from '@nestjs/swagger';

/**
 * 테스트용 컨트롤러, 추후 삭제할것
 */
@ApiExcludeController()
@Controller()
export class Neo4jController {
  constructor(
    private readonly neo4jservice: Neo4jService,
    private readonly memberService: MemberGraphService,
    private readonly subjectService: SubjectGraphService,
    private readonly analysisService: AnalysisService,
  ) {}

  @Post('member')
  async create(@Body() dto :CreateMemberGraphDto){
    await this.memberService.createMember(dto.nickname, SocialType.KAKAO)
    return { message: 'User created' };
  }

  @Get('member/:name')
  async findOne(@Param('name') name: string) {
    const users = await this.neo4jservice.findOneByName(name);
    return { users };
  }

  @Get('member')
  async findAll() {
    const users = await this.neo4jservice.findAllUsers();
    return { users };
  }

  @Get('subject')
  async getSubject(@Query('memberId') memberId: string, @Query('name') name: string) {
    const subject = await this.subjectService.getSubjectByName(memberId, name, SubjectType.PERSON)
    return { subject }
  }

  @Get('subject/all')
  async getSubjects(@Query('id') memberId: string){
    const subjects = await this.subjectService.getSubjectsKnownByMember(memberId)
    return { subjects }
  }

  @Post('subject')
  async createSubject(@Body() dto: CreateSubjectDto){
    const subject = await this.subjectService.createSubject(dto)
    return { subject }
  }

  @Post('analysis')
  async analysis(@Body('prompt') prompt: string) {
    return await this.analysisService.analysisAll(prompt);
  }

}
