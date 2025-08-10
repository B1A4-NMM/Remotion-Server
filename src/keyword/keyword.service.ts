import { Injectable } from '@nestjs/common';
import { QdrantService } from '../vector/qdrant.service';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '../vector/embedding.service';
import { ClaudeService } from '../claude/claude.service';
import { Diary } from '../entities/Diary.entity';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '../entities/Member.entity';
import { SimsceEmbedderService } from '../vector/simsce-embedder.service';

@Injectable()
export class KeywordService {
  private readonly collection = 'keyword';

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly configService: ConfigService,
    private readonly embedService: SimsceEmbedderService,
    private readonly LLMService: ClaudeService,
  ) {}

  async createCollection() {
    await this.qdrantService.createCollectionIfNotExist(this.collection, 1024);
  }

  async deleteAllVector() {
    await this.qdrantService.deleteAllVector(this.collection);
  }

  async createByDiary(diary:Diary, content:string) {
    const keywords = await this.LLMService.getParsingKeywordDiary(content)
    await this.saveKeywordsToQdrant(keywords, diary.author, diary.id)
  }

  async getDiaryIdBySearchKeyword(keyword:string, memberId:string) {
    const result = await this.qdrantService.searchByMemberAndScore(
      this.collection,
      await this.embedService.embed(keyword),
      memberId,
      0.98,
    );

    return result.map(doc => ({
      keyword: doc.payload!.keyword,
      diaryId: doc.payload!.diaryId
    }))
  }

  private async saveKeywordsToQdrant(
    keywords: string[],
    author: Member,
    diaryId: number
  ): Promise<void> {
    if (!keywords?.length) return;

    const unique = Array.from(new Set(keywords));

    // 없으면 개별 임베딩을 동시에 수행
    const vectors = await Promise.all(
      unique.map((kw) => this.embedService.embed(kw))
    );

    // 2) Qdrant 배치 업서트용 포인트 구성
    const points = unique.map((kw, i) => ({
      id: uuidv4(),
      vector: vectors[i],
      payload: {
        memberId: author.id,  // 키 컨벤션 통일
        diaryId,
        keyword: kw,
      },
    }));

    // 3) 배치 업서트
    await this.qdrantService.upsertPoints(this.collection, points);
  }

}
