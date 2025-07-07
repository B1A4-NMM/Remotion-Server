import { Injectable } from '@nestjs/common';
import { AchievementClusterService } from './achievement-cluster.service';
import { DiaryAnalysisDto } from '../diary/dto/diary-analysis.dto';
import { Diary } from '../entities/Diary.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DiaryAchievement } from '../entities/diary-achievement.entity.';
import { Repository } from 'typeorm';
import { DiaryAchievementCluster } from '../entities/diary-achievement-cluster.entity';
import { SimsceEmbedderService } from '../vector/simsce-embedder.service';
import { Member } from '../entities/Member.entity';
import { MemberService } from '../member/member.service';
import { AchievementRes, AllAchievementRes } from '../member/dto/all-achievement.res';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(DiaryAchievement)
    private readonly achievementRepo: Repository<DiaryAchievement>,
    @InjectRepository(DiaryAchievementCluster)
    private readonly achievementClusterRepo: Repository<DiaryAchievementCluster>,
    private readonly achievementClusterService: AchievementClusterService,
    private readonly embedder: SimsceEmbedderService,
    private readonly memberService: MemberService,
  ) {}

  /**
   * 멤버를 인자로 받아 이 멤버의 모든 성취 클러스터를 가져옵니다
   */
  async getAllAchievementCluster(memberId:string) {
    const member = await this.memberService.findOne(memberId)
    const clusters = await this.achievementClusterRepo.find({
      where: { author: member },
    });

    let res = new AllAchievementRes();
    for (const cluster of clusters) {
      let achievementRes = new AchievementRes();
      achievementRes.id = cluster.id
      achievementRes.label = cluster.label
      achievementRes.count = cluster.clusteredCount
      res.achievements.push(achievementRes)
    }

    return res;
  }

  /**
   * 다이어리를 생성할 때, 같이 분석된 성취를 저장합니다
   * 이미 클러스터가 존재하면 벡터 DB에는 저장하지 않고, RDB의 DiaryAchievement를 만들고 DiaryAchievementCluster에 추가
   * 클러스터가 존재하지 않으면, 클러스터를 새로 만들고 RDB와 벡터 DB에 추가
   */
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
    clusterEntity.clusteredCount = 1

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

    clusterEntity.clusteredCount++ // 카운트 증가
    await this.achievementClusterRepo.save(clusterEntity);

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