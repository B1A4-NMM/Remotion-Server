import { Injectable } from '@nestjs/common';
import { AchievementClusterService } from './achievement-cluster.service';
import { DiaryAnalysisDto } from '../diary/dto/diary-analysis.dto';
import { Diary } from '../entities/Diary.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DiaryAchievement } from '../entities/diary-achievement';
import { Repository } from 'typeorm';
import { DiaryAchievementCluster } from '../entities/diary-achievement-cluster.entity';
import { SimsceEmbedderService } from './simsce-embedder.service';
import { Member } from '../entities/Member.entity';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(DiaryAchievement)
    private readonly achievementRepo: Repository<DiaryAchievement>,
    @InjectRepository(DiaryAchievementCluster)
    private readonly achievementClusterRepo: Repository<DiaryAchievementCluster>,
    private readonly achievementClusterService: AchievementClusterService,
    private readonly embedder: SimsceEmbedderService,
  ) {}

  async createByDiary(dto: DiaryAnalysisDto, diary: Diary, member: Member) {
    const achievements = dto.achievements;

    for (const achievement of achievements) {
      const result =
        await this.achievementClusterService.searchTopAchievementCluster(
          achievement,
          member.id,
        );
      if (result.length > 0) {
        // 이미 클러스터가 존재할 경우
        await this.clusteringAchievement(
          result[0].id,
          result[0].payload,
          diary,
          achievement,
        );
      } else {
        // 새로운 클러스터일 경우
        await this.createNewCluster(achievement, member);
      }
    }
  }

  /**
   * 클러스터 새로 추가
   */
  private async createNewCluster(achievement: string, member: Member) {
    let created =
      await this.achievementClusterService.createAchievementClusterVector(
        achievement,
        member.id,
      ); // 벡터 DB에 저장

    let clusterEntity = new DiaryAchievementCluster();
    clusterEntity.id = created.id;
    clusterEntity.label = achievement;
    clusterEntity.author = member;
    clusterEntity.centroid = created.vector;

    await this.achievementClusterRepo.save(clusterEntity);
  }

  /**
   * 이미 존재하는 클러스터에 추가
   */
  private async clusteringAchievement(
    clusterId: string | number,
    cluster,
    diary: Diary,
    achievement: string,
  ) {
    // @ts-ignore
    const id: string = clusterId;
    const clusterEntity = await this.achievementClusterRepo.findOneOrFail({
      where: { id: id },
    });
    let achievementEntity = new DiaryAchievement();
    achievementEntity.cluster = clusterEntity;
    achievementEntity.diary = diary;
    achievementEntity.content = achievement;
    achievementEntity.vector = await this.embedder.embed(achievement);
    await this.achievementRepo.save(achievementEntity);

    const clusters = await this.achievementRepo.find({
      where: { cluster: {id: id} },
    });
    const avgVector = this.averageVectors(
      clusters.map((cluster) => cluster.vector),
    );

    await this.achievementClusterService.updateAchievementClusterVector(
      id,
      avgVector,
    ); // 업데이트
  }

  /**
   * 벡터 재계산
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
}