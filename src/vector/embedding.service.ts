import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { response, text } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService {

  constructor(private readonly configService: ConfigService) {
  }

  async embed(text: string, isQuery = true): Promise<number[]> {
    const prefix = isQuery ? 'query:' : 'passage:';

    const embed_url = this.configService.get('EMBED_MODEL_URL');

    const response = await axios.post(embed_url, {
      text,
      prefix,
    });

    return response.data.embedding; // float[] 벡터
  }

  async embed_query(text: string): Promise<number[]> {
    return this.embed(text, true);
  }

  async embed_passage(text: string): Promise<number[]> {
    return this.embed(text, false);
  }
}
