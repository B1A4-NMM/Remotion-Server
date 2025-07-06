import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SimsceEmbedderService {

  constructor(private readonly configService: ConfigService) {
  }

  async embed(text: string): Promise<number[]> {
    const embed_url = this.configService.get('SIMCSE_MODEL_URL');
    const cleanText = text.trim();

    if (!cleanText) {
      throw new Error('빈 문자열은 임베딩할 수 없습니다.');
    }

    const response = await axios.post(embed_url, { text: cleanText });

    if (!response.data.success || !response.data.embedding) {
      // @ts-ignore
      throw new Error('임베딩 실패: ' + response.data.error ?? 'Unknown error');
    }

    return response.data.embedding;
  }

}