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

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member) private readonly repo: Repository<Member>,
  ) {}

  create(dto: CreateMemberDto) {
    const member = new Member();
    member.id = dto.id
    member.email = dto.email
    member.nickname = dto.nickname
    member.social_type = dto.socialType
    member.daily_limit = MEMBER_DAILY_LIMIT
    return this.repo.save(member)
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
    return this.repo.findOneBy({id: id, social_type: type})
  }

  update(id: number, updateMemberDto: UpdateMemberDto) {
    return `This action updates a #${id} member`;
  }

  remove(id: number) {
    return `This action removes a #${id} member`;
  }


}
