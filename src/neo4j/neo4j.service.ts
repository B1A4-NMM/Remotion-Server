// src/neo4j/neo4j.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private readonly driver: Driver;

  constructor(private readonly configService: ConfigService) {

    const url = this.configService.get('NEO4J_URL');
    const username = this.configService.get('NEO4J_USERNAME');
    const password = this.configService.get('NEO4J_PASSWORD');

    this.driver = neo4j.driver(
      url,
      neo4j.auth.basic(username, password),
    );
  }

  getSession(): Session {
    return this.driver.session();
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  async read<T>(work: (session: Session) => Promise<T>): Promise<T> {
    const session = this.getSession();
    try {
      return await work(session);
    } finally {
      await session.close();
    }
  }

  //for test========================================================================================
  async createUser(name: string, _alias:string): Promise<void> {
    await this.read(async session => {
      await session.run('CREATE (u:User {name: $name, alias: $alias})', { name: name, alias: _alias });
    })
  }

  async findAllUsers() {
    return this.read(async session => {
      const result = await session.run('MATCH (m:Member) RETURN m');
      return result.records.map(record => {
        const user = record.get('m'); // Node 타입
        return {
          id: user.properties.id,
          nickname: user.properties.nickname,
          social_type: user.properties.social_type,
          daily_limit: user.properties.daily_limit,
        };
      });
    });
  }

  async findOneByName(nickname: string){
    return this.read(async session => {
      const result = await session.run('match (m:Member) where m.nickname = $name return m', {name: nickname})
      return result.records.map(record => {
        const user = record.get('u'); // Node 타입
        return {
          id: user.properties.id,
          nickname: user.properties.nickname,
          social_type: user.proerties.social_type,
          daily_limit: user.properties.daily_limit,
        };
      });
    })
  }



  //for test============================================================================================

}
