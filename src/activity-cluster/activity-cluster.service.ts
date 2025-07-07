import { Injectable } from '@nestjs/common';
import { THRESHOLD } from '../constants/threshold.constansts';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityCluster } from '../entities/activity-cluster.entity';
import { Repository } from 'typeorm';
import { LocalDate } from 'js-joda';
import { QdrantService } from '../vector/qdrant.service';
import { SimsceEmbedderService } from '../vector/simsce-embedder.service';

@Injectable()
export class ActivityClusterService {
  private readonly collection = 'activity_cluster';

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly simsceEmbedderService: SimsceEmbedderService,
    @InjectRepository(ActivityCluster)
    private readonly activityClusterRepo: Repository<ActivityCluster>,
  ) {
    this.qdrantService.createCollectionIfNotExist(this.collection, 768);
  }

  public async getActivityClusterByPeriod(memberId:string, period: number) {

    const today = LocalDate.now()
    const start = today.minusDays(period)

    const clusters = await this.activityClusterRepo.find({
      where: {author : {id : memberId}}
    })



  }

  async deleteAllVector() {
    await this.qdrantService.deleteAllVector(this.collection);
  }

  public async searchTopActivityCluster(text: string, memberId: string) {
    const vector = await this.simsceEmbedderService.embed(text);
    return await this.qdrantService.searchTopVectorByMember(this.collection, vector, memberId, THRESHOLD)
  }

  public async createActivityClusterVector(text: string, memberId: string) {
    const vector = await this.simsceEmbedderService.embed(text);
    let id = uuid();
    await this.upsert(id, vector, {
      text: text,
      memberId: memberId,
    });

    return {id :id, vector: vector, memberId: memberId};
  }

  public async updateActivityClusterVector(id:string, vector: number[]) {
    await this.qdrantService.updateVector(this.collection, id, vector);
  }

  public async searchActivityByMember(text: string, memberId: string) {
    const vector = await this.simsceEmbedderService.embed(text);

    const result = await this.qdrantService.searchVectorByMember(
      this.collection,
      vector,
      memberId.toString(),
      10,
    );

    return result;
  }

  async upsert(
    id: string,
    vector: number[],
    payload: Record<string, any>,
  ) {
    await this.qdrantService.upsertVector(this.collection, id, vector, payload);
  }

}