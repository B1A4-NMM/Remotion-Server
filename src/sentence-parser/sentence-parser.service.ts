import { Injectable } from '@nestjs/common';
import { QdrantService } from '../vector/qdrant.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Diary } from '../entities/Diary.entity';
import { EmbeddingService } from '../vector/embedding.service';
import { Member } from '../entities/Member.entity';
import { LocalDate } from 'js-joda';
import { v4 as uuidv4 } from 'uuid';
import { SEARCH_TOP_K } from '../constants/search.contants';

@Injectable()
export class SentenceParserService {
  private readonly collection = 'diary_sentence';

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly configService: ConfigService,
    private readonly embedService: EmbeddingService,
  ) {
    this.createCollection();
  }

  async createCollection() {
    await this.qdrantService.createCollectionIfNotExist(this.collection, 1024);
  }

  async deleteAllVector() {
    await this.qdrantService.deleteAllVector(this.collection);
  }

  /**
   * 텍스트를 받아 문장 단위로 파싱하여 반환합니다
   */
  async parsingText(text: string) {
    const url = this.configService.get('PARSER_MODEL_URL');
    const response = await axios.post(url, { text: text });
    return response.data.sentences;
  }

  /**
   * 일기를 인자로 받아 일기의 내용을 파싱하여 메타데이터와 함께 벡터 디비에 저장합니다
   */
  async createByDiary(diary: Diary) {
    const content = diary.content;
    const sentences: string[] = await this.parsingText(content);
    const author = diary.author;
    const date = diary.written_date;
    const diaryId = diary.id;

    await this.saveSentencesToQdrant(sentences, author, date, diaryId);
  }

  /**
   * 멤버 아이디와 문장을 받아 유사한 문장을 조회합니다, SEARCH_TOP_K개의 문장을 반환합니다
   */
  async searchSentenceByMember(query: string, memberId: string) {
    const vector = await this.embedService.embed_query(query);
    const hits = await this.qdrantService.searchVectorByMember(
      this.collection,
      vector,
      memberId.toString(),
      100,
    );

    if (hits.length === 0) return [];

    const dedupedByDiaryId: any[] = [];
    const seen = new Set<number>();
    for (const hit of hits) {
      const diaryId = hit.payload?.diary_id as number;
      if (diaryId && !seen.has(diaryId)) {
        seen.add(diaryId);
        dedupedByDiaryId.push(hit);
      }
      if (dedupedByDiaryId.length >= 20) break;
    }

    const candidates = dedupedByDiaryId
      .filter((hit) => hit?.payload?.sentence)
      .map((hit) => ({
        id: hit.id,
        text: hit!.payload!.sentence,
        payload: hit.payload,
        vectorScore: hit.score,
      }));

    // rerank 요청
    const rerankUrl = this.configService.get('RERANK_MODEL_URL');
    const rerankRes = await axios.post(rerankUrl, {
      query,
      candidates: candidates.map((c) => c.text),
    });

    const reranked: { text: string; score: number }[] = rerankRes.data;

    // text 기반으로 payload 다시 붙이기
    const final = reranked.map((item) => {
      const original = candidates.find((c) => c.text === item.text);
      return {
        id: original?.id ?? null,
        text: item.text,
        rerankScore: item.score,
        vectorScore: original?.vectorScore ?? null,
        payload: original?.payload ?? {},
      };
    });

    return final.slice(0, SEARCH_TOP_K); // Top-K 개수 제한
  }

  async deleteAllByDiaryId(diaryId: number) {
    await this.qdrantService.deleteAllByCondition(this.collection, 'diary_id', diaryId)
  }

  /**
   * 문장을 qdrant에 저장합니다
   */
  private async saveSentencesToQdrant(
    sentences: string[],
    author: Member,
    date: LocalDate,
    diaryId: number,
  ) {
    for (const sentence of sentences) {
      const payload = {
        diary_id: diaryId,
        memberId: author.id,
        sentence: sentence,
        date: date,
      };

      const vector = await this.embedService.embed_passage(sentence);

      await this.qdrantService.upsertVector(
        this.collection,
        uuidv4(),
        vector,
        payload,
      );
    }
  }
}
