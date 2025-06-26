import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { CreateVectorDto } from './dto/create-vector.dto';
import axios from 'axios';

@Injectable()
export class VectorService {
  constructor(
    private readonly qdrant: QdrantService,
    private readonly embedder: EmbeddingService,
  ) {}

  async create(dto: CreateVectorDto) {
    const vector = await this.embedder.embed_passage(dto.text);
    await this.qdrant.upsert(uuid(), vector, {
      date: dto.date,
      text: dto.text,
    });
    return { ok: true };
  }

  async search(query: string) {
    const queryVector = await this.embedder.embed_query(query);

    // 1. Qdrant에서 top-N 후보 검색
    const hits = await this.qdrant.search(queryVector, 10);

    // 2. text payload만 추출
    const candidates = hits
      .filter((h) => h && h.payload)
      .map((h) => ({
        text: h.payload?.text ?? '',
        date: h.payload?.date ?? '',
        raw: h, // 점수와 id 등 원본 보존
      }));

    // 3. rerank 서버로 POST
    const rerankRes = await axios.post('http://localhost:5002/rerank', {
      query: query,
      candidates: candidates.map((c) => c.text),
    });

    const rerankedTexts: { text: string; score: number }[] = rerankRes.data;

    // 4. reranked 순서에 맞춰 원본 payload 찾아서 매핑
    const finalResults = rerankedTexts.map((reranked) => {
      const original = candidates.find((c) => c.text === reranked.text);
      return {
        date: original?.date ?? '',
        text: reranked.text,
        score: reranked.score, // Cross-Encoder 기반 score
      };
    });

    return finalResults.slice(0, 5); // 필요 시 Top-K 제한
  }
}

