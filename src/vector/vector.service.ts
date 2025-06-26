import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { CreateVectorDto } from './dto/create-vector.dto';

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
    const vector = await this.embedder.embed_query(query);
    const hits = await this.qdrant.search(vector, 10);

    return hits
      .filter((h) => h && h.payload) // 완전히 안전하게
      .map((h) => ({
        date: h.payload?.date ?? '',
        text: h.payload?.text ?? '',
        score: h.score ?? 0,
      }));
  }
}
