import { Injectable } from '@nestjs/common';
import { CreateGraphDiaryDto } from './dto/graph.create-diary.dto';
import { CommonUtilService } from '../../util/common-util.service';
import { Neo4jService } from '../../neo4j/neo4j.service';

@Injectable()
export class DiaryGraphService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly util: CommonUtilService,
  ) {}

  async create(dto: CreateGraphDiaryDto) {

    // 이 노드의 고유한 id를 제작
    const id = this.util.generateUUID();

    const result = await this.neo4jService.read(async (session) => {
      return session.run(`
      MATCH (m:Member {id: $authorId})
     
      CREATE (d:Diary {
      id: $id, 
      create_date: $create_date,
      written_date: $written_date,
      content: $content,
      title: $title,
      weather: $weather,
      photo_path: $photo_path,
      })
      
      CREATE (m)-[w:WRITTEN {relation: $relation}]->(d)
      RETURN d
      `
        ,
        {
          id: id,
          create_date: this.util.getCurrentDate(),
          written_date: dto.written_date,
          content: dto.content,
          title: dto.title,
          weather: dto.weather,
          photo_path: dto.photo_path,
        });
    });

    const node = result.records[0].get('d');
    const nodeProps = node.properties;


  }
}
