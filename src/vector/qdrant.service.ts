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

  public async updateVector(collection:string ,id: string, vector: number[]) {
    await this.client.updateVectors(collection, {
      points: [{ id, vector }],
    });
  }

  public async deleteAllVector(collection: string) {
    try {
      await this.client.delete(collection, {
        filter: {},
      });
      this.logger.log(`All vectors deleted from collection: ${collection}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete all vectors from collection ${collection}:`,
        error,
      );
      throw error;
    }
  }

  async createCollectionIfNotExist(name: string, vector_size: number) {
    try {
      await this.client.getCollection(name);
    } catch {
      await this.client.createCollection(name, {
        vectors: { size: vector_size, distance: 'Cosine' },
      });
      this.logger.log('Qdrant collection created');
    }
  }

  async upsertVector(
    collection: string,
    id: string,
    vector: number[],
    payload: any,
  ) {
    await this.client.upsert(collection, {
      wait: true,
      points: [{ id, vector, payload }],
    });
  }

  async searchTopVectorByMember(
    collection: string,
    vector: number[],
    memberId: string,
    threshold: number,
  ) {
    return this.client.search(collection, {
      vector,
      limit: 1,
      score_threshold: threshold,
      filter: {
        must: [
          {
            key: 'memberId',
            match : {
              value: memberId,
            }
          }
        ],
      },
    });
  }

  async searchVectorByMember(
    collection: string,
    vector: number[],
    memberId: string,
    limit = 5,
  ) {
    return this.client.search(collection, {
      vector,
      limit: limit,
      filter: {
        must: [
          {
            key: 'memberId',
            match : {
              value: memberId,
            }
          }
        ],
      },
    });
  }

  async searchTopVector(
    collection: string,
    vector: number[],
    threshold: number,
  ) {
    return this.client.search(collection, {
      vector,
      limit: 1,
      score_threshold: threshold,
    });
  }

  async searchVector(collection: string, vector: number[], limit = 5) {
    return this.client.search(collection, { vector, limit });
  }

  async upsert(id: string, vector: number[], payload: Record<string, any>) {
    await this.client.upsert(this.collection, {
      wait: true,
      points: [{ id, vector, payload }],
    });
  }

  async search(vector: number[], limit = 5, collection:string = this.collection) {
    return this.client.search(collection, { vector, limit });
  }

  async getVectorById(collection: string, id: string) {
    return this.client.retrieve(collection, {
      ids: [id],
      with_payload: true,
      with_vector: false,
    });
  }
}
