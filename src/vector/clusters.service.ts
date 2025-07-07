import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { MakeClusterDto } from './dto/make-cluster.dto';

@Injectable()
export class ClustersService {

  constructor(
    private readonly configService: ConfigService,
  ) {
  }

  async getClusters(dto: MakeClusterDto) {
    const cluster_url = this.configService.get('CLUSTER_MODEL_URL');

    console.log("🔍 보내는 클러스터링 요청:", JSON.stringify(dto, null, 2));
    const response = await axios.post(cluster_url, dto,{
      headers: {
        'Content-Type': 'application/json', // ✅ JSON 명시
      },
    });

    return response.data
  }

}