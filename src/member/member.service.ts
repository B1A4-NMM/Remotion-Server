import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Neo4jService } from '../neo4j/neo4j.service';
import { Repository } from 'typeorm';
import { Member } from '../entities/Member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SocialType } from '../enums/social-type.enum';
import { MEMBER_DAILY_LIMIT } from '../constants/member.constant';
import { MemberSummary } from '../entities/member-summary.entity';
import { AchievementService } from '../achievement-cluster/achievement.service';
import { MemberSummaryService } from './member-summary.service';
import { LocalDate } from 'js-joda';
import { RoutineEnum } from '../enums/routine.enum';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member) private readonly repo: Repository<Member>,
    private readonly summaryService: MemberSummaryService,
  ) {}

  create(dto: CreateMemberDto) {
    const member = new Member();
    member.id = dto.id;
    member.email = dto.email;
    member.nickname = dto.nickname;
    member.social_type = dto.socialType;
    member.daily_limit = MEMBER_DAILY_LIMIT;
    member.anxiety_test_date = LocalDate.parse('1990-01-01');
    member.stress_test_date = LocalDate.parse('1990-01-01');
    member.depression_test_date = LocalDate.parse('1990-01-01');
    return this.repo.save(member);
  }

  findAll() {
    return `This action returns all member`;
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.repo.findOneBy({ id });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  findSocialMember(id: string, type: SocialType) {
    return this.repo.findOneBy({ id: id, social_type: type });
  }

  update(id: number, updateMemberDto: UpdateMemberDto) {
    return `This action updates a #${id} member`;
  }

  remove(id: number) {
    return `This action removes a #${id} member`;
  }

  createMemberSummaryRes(summary: any, period: number) {
    return this.summaryService.createMemberSummaryRes(summary, period);
  }

  /**
   * 멤버의 특정 테스트 날짜를 현재 날짜로 갱신합니다.
   * @param memberId 멤버 ID
   * @param routineType 갱신할 테스트 타입 (스트레스, 불안, 우울)
   */
  async updateTestDate(memberId: string, routineType: RoutineEnum) {
    const member = await this.findOne(memberId);
    const today = LocalDate.now();

    switch (routineType) {
      case RoutineEnum.STRESS:
        member.stress_test_date = today;
        break;
      case RoutineEnum.ANXIETY:
        member.anxiety_test_date = today;
        break;
      case RoutineEnum.DEPRESSION:
        member.depression_test_date = today;
        break;
      default:
        throw new Error(`Invalid RoutineEnum type: ${routineType}`);
    }
    await this.repo.save(member);
  }
}
