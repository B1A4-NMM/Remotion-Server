import { Injectable } from '@nestjs/common';
import { CommonUtilService } from '../../util/common-util.service';
import { SocialType } from '../../enums/social-type.enum';
import { MEMBER_DAILY_LIMIT } from '../../constants/member.constant';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class MemberGraphService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly util: CommonUtilService,
  ) {}

  async createMember(
    nickname: string,
    social_type: SocialType,
  ) {
    const newId = this.util.generateUUID();
    await this.neo4jService.read(async (session) => {
      await session.run(`CREATE (m:Member {
      id: $id, 
      nickname: $nickname,
      social_type: $social_type,
      daily_limit: $limit
      })`,
        {
          id: newId,
          nickname: nickname,
          social_type: social_type,
          limit: MEMBER_DAILY_LIMIT
        }
      )
    })
    return newId
  }
}