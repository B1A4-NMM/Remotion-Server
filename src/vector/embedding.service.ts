// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import {
//   BedrockRuntimeClient,
//   InvokeModelCommand,
// } from '@aws-sdk/client-bedrock-runtime';
//
// @Injectable()
// export class EmbeddingService {
//   private bedrockClient: BedrockRuntimeClient;
//
//   constructor(private config: ConfigService) {
//     // @ts-ignore
//     this.bedrockClient = new BedrockRuntimeClient({
//       region: this.config.get('AWS_REGION'),
//       credentials: {
//         accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
//         secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
//       },
//     });
//   }
//
//   async embed(text: string): Promise<number[]> {
//     const modelId = this.config.get('BEDROCK_EMBED_MODEL_ID') // 예시
//
//     const input = {
//       inputText: text,
//     };
//
//     const command = new InvokeModelCommand({
//       modelId,
//       contentType: 'application/json',
//       accept: 'application/json',
//       body: JSON.stringify(input),
//     });
//
//     const response = await this.bedrockClient.send(command);
//     const body = JSON.parse(new TextDecoder().decode(response.body));
//
//     return body.embedding;
//   }
// }

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
  async embed(text: string, isQuery = true): Promise<number[]> {
    const prefix = isQuery ? 'query:' : 'passage:';

    const response = await axios.post('http://localhost:5001/embed', {
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
