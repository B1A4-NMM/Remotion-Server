import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantService } from '../vector/qdrant.service';
import { SimsceEmbedderService } from './simsce-embedder.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AchievementClusterService {

  private readonly collection = 'achievement_cluster';

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly simecseEmbedderService: SimsceEmbedderService,
    ) {
    this.qdrantService.createCollectionIfNotExist(this.collection, 768)
  }

  private async upsert(id: string, vector: number[], payload: Record<string, any>) {
    await this.qdrantService.upsertVector(this.collection, id, vector, payload)
  }

  private async search(vector: number[], limit = 5) {
    return await this.qdrantService.searchVector(this.collection, vector, limit)
  }

  async createText(text: string) {
    const vector = await this.simecseEmbedderService.embed(text)
    await this.upsert(uuid(), vector, {
      text: text
    })
    return { text: text}
  }

  async searchText(text: string) {
    console.log(`search = ${text}`)
    const vector = await this.simecseEmbedderService.embed(text)
    const result = await this.search(vector)
    return result;
  }

}
