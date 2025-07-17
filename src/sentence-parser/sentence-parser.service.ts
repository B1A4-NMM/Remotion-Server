import { Injectable } from '@nestjs/common';
import { QdrantService } from '../vector/qdrant.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Diary } from '../entities/Diary.entity';
import { EmbeddingService } from '../vector/embedding.service';
import { Member } from '../entities/Member.entity';
import { LocalDate } from 'js-joda';
import { v4 as uuidv4 } from 'uuid';
import { SEARCH_THRESHOLD, SEARCH_TOP_K } from '../constants/search.contants';
import { ClaudeService } from '../claude/claude.service';


@Injectable()
export class SentenceParserService {
  private readonly collection = 'diary_sentence';

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly configService: ConfigService,
    private readonly embedService: EmbeddingService,
    private readonly LLMService: ClaudeService
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
  async createByDiary(diary: Diary, taggingContent:string) {
    const content = taggingContent;
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

    candidates.map((c) => (
      console.log(`candidates text = ${c.text}, vectorScore = ${c.vectorScore}`)
    ))

    // rerank 요청
    const rerankUrl = this.configService.get('RERANK_MODEL_URL');
    const rerankRes = await axios.post(rerankUrl, {
      query,
      candidates: candidates.map((c) => ({
        id: c.id,
        text: c.text,
      })),
    });


    const reranked: { id:string ,text: string; score: number }[] = rerankRes.data;

    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    const final = reranked.map((item) => {
      const original = candidateMap.get(item.id);
      return {
        id: item.id,
        text: item.text,
        rerankScore: item.score,
        vectorScore: original?.vectorScore ?? null,
        payload: original?.payload ?? {},
      };
    });

    final.map((f) => (
      console.log(`final text = ${f.text}, rankScore = ${f.rerankScore}`)
    ))

    // 🔽 필터 추가: rerankScore가 0.7 이상인 것만
    const filtered = final.filter((item) => item.rerankScore >= SEARCH_THRESHOLD);

    const payloads: {diary_id:number, memberId:string, sentence:string, date:string}[] = filtered.map((item) => item.payload);
    let ragResult = await this.LLMService.getSearchDiary(query, payloads);
    ragResult = ragResult.filter(rag => rag.is_similar == true)

    ragResult.map((rag) => (
      console.log(`rag text = ${rag.sentence}, diaryId = ${rag.diary_id}`)
    ))

// 🔽 Top-K 제한
    return ragResult.slice(0, SEARCH_TOP_K); // Top-K 개수 제한
  }

  /**
   * diary_id를 사용해서 벡터 DB에 저장된 문서들을 삭제합니다
   */
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
