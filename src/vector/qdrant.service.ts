import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService {
  private readonly client = new QdrantClient({
    url: process.env.QDRANT_URL,
  });
  private readonly collection = 'diary';
  private readonly logger = new Logger(QdrantService.name);

  constructor() {
    this.ensureCollection();
  }

  private async ensureCollection() {
    try {
      await this.client.getCollection(this.collection);
    } catch {
      await this.client.createCollection(this.collection, {
        vectors: { size: 1024, distance: 'Cosine' },
      });
      this.logger.log('Qdrant collection created');
    }
  }

  async upsert(id: string, vector: number[], payload: Record<string, any>) {
    await this.client.upsert(this.collection, {
      wait: true,
      points: [{ id, vector, payload }],
    });
  }

  async search(vector: number[], limit = 5) {
    return this.client.search(this.collection, { vector, limit });
  }
}
