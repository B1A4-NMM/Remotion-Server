import { SubjectType } from '../../enums/subject-type.enum';
import { CommonUtilService } from '../../util/common-util.service';
import { Injectable } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { Neo4jService } from '../../neo4j/neo4j.service';

@Injectable()
export class SubjectGraphService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly util: CommonUtilService,
  ) {}

  async getSubjectsKnownByMember(
    memberId: string,
  ): Promise<{ subjectId: string; name: string; type: string }[]> {
    const result = await this.neo4jService.read((session) =>
      session.run(
        `
        MATCH (m:Member {id: $memberId})-[:KNOWS]->(s:Subject)
        RETURN s.id AS subjectId, s.name AS name, s.type AS type
        `,
        { memberId },
      ),
    );

    return result.records.map((record) => ({
      subjectId: record.get('subjectId'),
      name: record.get('name'),
      type: record.get('type'),
    }));
  }

  async getSubjectByName(memberId: string, name: string, type: SubjectType) {
    const result = await this.neo4jService.read(async (session) => {
      return session.run(
        `
        MATCH (m:Member {id: $memberId})
        MATCH (m)-[:KNOWS]->(s:Subject)
        OPTIONAL MATCH (s)-[:HAS_ALIAS]->(a:Alias)

        WITH s, a
        WHERE s.name = $name OR (a IS NOT NULL AND a.name = $name)
        RETURN s
        `,
        {
          memberId: memberId,
          name: name,
        },
      );
    });

    const record = result.records[0];

    if(!record) return null;

    const node = record.get('s');
    const nodeProps = node.properties;

    return {
      subjectId: nodeProps.id,
      name: nodeProps.name,
      type: nodeProps.type,
      recentDate: nodeProps.recent_date,
      createDate: nodeProps.create_date,
      affection: nodeProps.affection,
      count: nodeProps.count,
    };
  }

  async createSubject(
    dto: CreateSubjectDto
  ) {
    const result = await this.getSubjectByName(dto.memberId, dto.name, dto.type);
    if(result) return result;

    const createResult = await this.neo4jService.read(async (session) => {
      return session.run(
        `
        match (m:Member {id: $memberId})
        create (s:Subject {id: $newId, name: $name, type: $type, recent_date: $recentDate, create_date: $createDate, affection: 0, count: 1})
        create (m)-[:KNOWS {relation: $relation}]->(s)
        return s
        `,
        {
          memberId: dto.memberId,
          name: dto.name,
          type: dto.type,
          newId: this.util.generateUUID(),
          recentDate: this.util.getCurrentDate(),
          createDate: this.util.getCurrentDate(),
          relation: dto.relation,
        },
      );
    })

    const node = createResult.records[0].get('s');
    const nodeProps = node.properties;

    return {
      subjectId: nodeProps.id,
      name: nodeProps.name,
      type: nodeProps.type,
      recentDate: nodeProps.recent_date,
      createDate: nodeProps.create_date,
      affection: nodeProps.affection,
      count: nodeProps.count,
    };
  }
}
