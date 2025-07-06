import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantService } from '../vector/qdrant.service';
import { SimsceEmbedderService } from './simsce-embedder.service';
import { v4 as uuid } from 'uuid';
import { THRESHOLD } from '../constants/threshold.constansts';

@Injectable()
export class AchievementClusterService {
  private readonly collection = 'achievement_cluster';

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly simecseEmbedderService: SimsceEmbedderService,
  ) {
    this.qdrantService.createCollectionIfNotExist(this.collection, 768);
  }

  async deleteAllVector() {
    await this.qdrantService.deleteAllVector(this.collection);
  }

  //==============================================================================================================

  public async searchTopAchievementCluster(text: string, memberId: string) {
    const vector = await this.simecseEmbedderService.embed(text);
    return await this.qdrantService.searchTopVectorByMember(this.collection, vector, memberId, THRESHOLD)
  }

  public async createAchievementClusterVector(text: string, memberId: string) {
    const vector = await this.simecseEmbedderService.embed(text);
    let id = uuid();
    await this.upsert(id, vector, {
      text: text,
      memberId: memberId,
    });

    return {id :id, vector: vector};
  }

  public async updateAchievementClusterVector(id:string, vector: number[]) {
    await this.qdrantService.updateVector(this.collection, id, vector);
  }

  //==============================================================================================================

  public async searchTopVector(text: string) {
    const vector = await this.simecseEmbedderService.embed(text);
    const result = await this.qdrantService.searchTopVector(this.collection, vector, THRESHOLD)
    if (result.length > 0) {
      console.log(`found top vector = ${JSON.stringify(result[0].payload)}`)
    }else {
      console.log(`not found top vector`)
    }
    return result
  }

  async upsert(
    id: string,
    vector: number[],
    payload: Record<string, any>,
  ) {
    await this.qdrantService.upsertVector(this.collection, id, vector, payload);
  }

  private async search(vector: number[], limit = 5) {
    return await this.qdrantService.searchVector(
      this.collection,
      vector,
      limit,
    );
  }

  async createText(text: string) {
    const vector = await this.simecseEmbedderService.embed(text);
    await this.upsert(uuid(), vector, {
      text: text,
    });
    return { text: text };
  }

  async searchText(text: string) {
    console.log(`search = ${text}`);
    const vector = await this.simecseEmbedderService.embed(text);
    const result = await this.search(vector);
    return result;
  }

  async searchTextByMember(text: string, memberId: string) {
    console.log(`search = ${text}, member = ${memberId}`);
    const vector = await this.simecseEmbedderService.embed(text);
    console.log(`vector = [${vector.slice(0, 5).join(', ')}...]`);

    const result = await this.qdrantService.searchVectorByMember(
      this.collection,
      vector,
      memberId,
      10,
    );

    console.log('result =', JSON.stringify(result, null, 2));
    return result;
  }
}
