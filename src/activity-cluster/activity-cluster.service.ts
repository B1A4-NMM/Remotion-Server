import { Injectable, Logger } from '@nestjs/common';
import { THRESHOLD } from '../constants/threshold.constansts';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityCluster } from '../entities/activity-cluster.entity';
import { Repository } from 'typeorm';
import { LocalDate } from 'js-joda';
import { QdrantService } from '../vector/qdrant.service';
import { SimsceEmbedderService } from '../vector/simsce-embedder.service';
import { Diary } from '../entities/Diary.entity';
import { Member } from '../entities/Member.entity';
import { Activity } from '../entities/Activity.entity';
import { ActivityEmotion } from '../entities/activity-emotion.entity';

@Injectable()
export class ActivityClusterService {
  private readonly logger = new Logger(ActivityClusterService.name);

  private readonly collection = 'activity_cluster';

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly simsceEmbedderService: SimsceEmbedderService,
    @InjectRepository(ActivityCluster)
    private readonly activityClusterRepo: Repository<ActivityCluster>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityEmotion)
    private readonly activityEmotionRepo: Repository<ActivityEmotion>,
  ) {
    this.qdrantService.createCollectionIfNotExist(this.collection, 768);
  }
  /**
   * 행동 하나를 인자로 받아서 클러스터가 있는지 확인하고, 있다면 클러스터에 추기,
   * 없다면 클러스터를 새로 만듭니다
   */
  public async createByActivity(
    activity: Activity,
    diary: Diary,
    member: Member,
  ) {
    const result = await this.searchTopActivityCluster(
      activity.content,
      member.id,
    );

    if (result.length > 0) {
      await this.clusteringActivity(
        result[0].id,
        result[0].payload,
        diary,
        activity,
      );
    } else {
      await this.createNewCluster(activity, member);
    }
  }

  public async deleteAllVector() {
    await this.qdrantService.deleteAllVector(this.collection);
  }

  public async updateActivityClusterVector(id: string, vector: number[]) {
    await this.qdrantService.updateVector(this.collection, id, vector);
  }

  /**
   * 이 함수는 ActivityCluster를 인자로 받아 해당 클러스터에 속한 모든 활동들의
   * 감정(Emotion)을 EmotionType 별로 집계하여 각 감정이 몇 번 나타났는지 알려주는 객체를 반환합니다.
   */
  public async getEmotionCountsByCluster(
    cluster: ActivityCluster,
  ): Promise<Record<string, number>> {
    const emotionCounts = await this.activityEmotionRepo
      .createQueryBuilder('activityEmotion')
      .select('activityEmotion.emotion', 'emotion')
      .addSelect('COUNT(activityEmotion.emotion)', 'count')
      .innerJoin('activityEmotion.activity', 'activity')
      .where('activity.cluster_id = :clusterId', { clusterId: cluster.id })
      .groupBy('activityEmotion.emotion')
      .getRawMany();

    return emotionCounts.reduce((acc, { emotion, count }) => {
      acc[emotion] = parseInt(count, 10);
      return acc;
    }, {});
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

  private async upsert(
    id: string,
    vector: number[],
    payload: Record<string, any>,
  ) {
    await this.qdrantService.upsertVector(this.collection, id, vector, payload);
  }

  private async searchTopActivityCluster(text: string, memberId: string) {
    const vector = await this.simsceEmbedderService.embed(text);
    return await this.qdrantService.searchTopVectorByMember(
      this.collection,
      vector,
      memberId,
      THRESHOLD,
    );
  }

  private async createActivityClusterVector(
    text: string,
    vector: number[],
    memberId: string,
  ) {
    let id = uuid();
    await this.upsert(id, vector, {
      text: text,
      memberId: memberId,
    });

    return { id: id, vector: vector, memberId: memberId };
  }

  /**
   * 행동 클러스터 새로 추가
   */
  private async createNewCluster(activity: Activity, member: Member) {
    let created = await this.createActivityClusterVector(
      activity.content,
      activity.vector,
      member.id,
    );

    let clusterEntity = new ActivityCluster();
    clusterEntity.id = created.id;
    clusterEntity.label = activity.content;
    clusterEntity.author = member;
    clusterEntity.centroid = activity.vector;
    clusterEntity.clusteredCount = 1;

    await this.activityClusterRepo.save(clusterEntity);

    activity.cluster = clusterEntity; // 액티비티의 클러스터 업데이트
    await this.activityRepo.save(activity);
  }

  /**
   * 클러스터에 새 엔티티 추가, 이후 벡터 재계산
   */
  private async clusteringActivity(
    clusterId: string | number,
    payload: any,
    diary: Diary,
    activity: Activity,
  ) {
    const id: string = clusterId.toString();
    const clusterEntity = await this.activityClusterRepo.findOne({
      where: { id: id },
    });

    if (!clusterEntity) {
      this.logger.warn(
        'clusteringActivity 진입하였지만, 행동 클러스터를 찾지 못했습니다. 이는 벡터DB와 RDB간 정합성이 깨진 경우입니다. 추후 수정이 필요합니다',
      );
      await this.deleteById(id)
      return;
    }

    const activities = await this.activityRepo.find({
      where: { cluster: { id: id } },
    });
    try {
      const avgVector = this.averageVectors(
        activities.map((activity) => activity.vector),
      );

      await this.updateActivityClusterVector(id, avgVector);
    } catch (e) {
      this.logger.warn(`현재 벡터 재계산 로직에서 오류가 발생하고 있습니다. 로그를 출력합니다. 
      행동 배열 길이 : ${activities.length}, 
      클러스터 ID : ${id}`)
    }
    clusterEntity.clusteredCount++;
    await this.activityClusterRepo.save(clusterEntity);

    activity.cluster = clusterEntity;
    await this.activityRepo.save(activity);
  }

  /**
   * 벡터 재계산 로직
   */
  private averageVectors(vectors: number[][]): number[] {
    const len = vectors.length;
    const dim = vectors[0].length;
    const sum = new Array(dim).fill(0);

    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        sum[i] += vec[i];
      }
    }
    return sum.map((v) => v / len);
  }

  public async getTopEmotionsByMember(memberId: string, limit: number = 3) {
    const clusters = await this.activityClusterRepo.find({
      where: { author: { id: memberId } },
    });

    const result: any[] = [];
    for (const cluster of clusters) {
      const emotionCounts = await this.getEmotionCountsByCluster(cluster);
      const sortedEmotions = Object.entries(emotionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([emotion, count]) => ({ emotion, count }));

      result.push({
        clusterId: cluster.id,
        clusterLabel: cluster.label,
        top3Emotions: sortedEmotions,
      });
    }

    return result;
  }

  /**
   * 행동 클러스터 하나 삭제
   */
  private async deleteById(id: string) {
    await this.qdrantService.deletePointById(this.collection, id)
  }
}
