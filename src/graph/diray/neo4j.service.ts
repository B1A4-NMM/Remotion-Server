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

}
