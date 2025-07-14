import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantService } from '../vector/qdrant.service';
import { SimsceEmbedderService } from '../vector/simsce-embedder.service';
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

    return {id :id, vector: vector, memberId: memberId};
  }

  public async updateAchievementClusterVector(id:string, vector: number[]) {
    await this.qdrantService.updateVector(this.collection, id, vector);
  }

  public async searchTextByMember(text: string, memberId: string) {
    const vector = await this.simecseEmbedderService.embed(text);

    const result = await this.qdrantService.searchVectorByMember(
      this.collection,
      vector,
      memberId.toString(),
      10,
    );

    return result;
  }

  //==============================================================================================================

  public async searchTopVector(text: string) {
    const vector = await this.simecseEmbedderService.embed(text);
    const result = await this.qdrantService.searchTopVector(this.collection, vector, THRESHOLD)

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
    const vector = await this.simecseEmbedderService.embed(text);
    const result = await this.search(vector);
    return result;
  }

  async deleteById(id: string) {
    await this.qdrantService.deletePointById(this.collection, id)
  }


}
