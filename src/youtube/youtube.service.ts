import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YoutubeApi } from '../entities/YoutubeApi.entity';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EMOTION_YOUTUBE_KEYWORDS } from '../constants/emotion-youtube.constant';
import { firstValueFrom } from 'rxjs';
import { EmotionType } from '../enums/emotion-type.enum'; // EmotionType 임포트

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly YOUTUBE_API_KEY: string;

  constructor(
    @InjectRepository(YoutubeApi)
    private readonly youtubeApiRepository: Repository<YoutubeApi>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.YOUTUBE_API_KEY = this.configService.get<string>('YOUTUBE_API_KEY')!;
    if (!this.YOUTUBE_API_KEY) {
      this.logger.error('YOUTUBE_API_KEY is not set in environment variables.');
    }
  }

  @Cron('0 0 * * *') // 매 자정마다 실행
  async handleCron() {
    this.logger.log('Calling searchAndStoreVideos() via cron job.');
    const env = this.configService.get<string>('ENVIRONMENT')!;
    if (env === 'develop' || env === 'production') {}
    await this.searchAndStoreVideos();
  }

  /**
   * Youtube API를 이용해 키워드로 검색된 영상을 저장합니다
   */
  async searchAndStoreVideos(): Promise<void> {
    this.logger.log('Starting YouTube video search and storage...');
    for (const emotionTypeKey in EMOTION_YOUTUBE_KEYWORDS) {
      const emotionType: EmotionType = emotionTypeKey as EmotionType; // 타입 캐스팅
      const searchKeywords = EMOTION_YOUTUBE_KEYWORDS[emotionType];

      // searchKeywords가 undefined가 아닌 경우에만 순회
      if (searchKeywords) {
        for (const searchKeyword of searchKeywords) {
          try {
            const videos = await this.searchYoutubeVideos(searchKeyword);
            for (const video of videos) {
              await this.saveVideo(
                emotionType,
                searchKeyword,
                video.videoId,
                video.title,
              );
            }
          } catch (error) {
            this.logger.error(
              `Failed to search or store videos for keyword "${searchKeyword}" (EmotionType: ${emotionType}): ${error.message}`,
              error.stack,
            );
          }
        }
      } else {
        this.logger.warn(`No search keywords defined for EmotionType: ${emotionType}. Skipping.`);
      }
    }
    this.logger.log('YouTube video search and storage completed.');
  }

  private async searchYoutubeVideos(
    query: string,
  ): Promise<{ videoId: string; title: string }[]> {
    const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
    const params = {
      key: this.YOUTUBE_API_KEY,
      q: query,
      part: 'snippet',
      type: 'video',
      maxResults: 5,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(YOUTUBE_API_URL, { params }),
      );
      return response.data.items
        .filter((item) => item.id.videoId)
        .map((item) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
        }));
    } catch (error) {
      this.logger.error(
        `Error searching YouTube for "${query}": ${error.message}`,
      );
      throw error;
    }
  }

  private async saveVideo(
    emotionType: EmotionType,
    searchKeyword: string,
    videoId: string,
    title: string,
  ): Promise<void> {
    const existingVideo = await this.youtubeApiRepository.findOne({
      where: { videoId },
    });

    if (!existingVideo) {
      const newVideo = this.youtubeApiRepository.create({
        emotion: emotionType,
        keyword: searchKeyword,
        videoId: videoId,
        title: title,
      });
      await this.youtubeApiRepository.save(newVideo);
      this.logger.log(
        `저장된 비디오: "${title}" (ID: ${videoId}) for EmotionType: ${emotionType}, SearchKeyword: ${searchKeyword}`,
      );
    } else {
      this.logger.debug(`Video ID ${videoId} already exists. Skipping.`);
    }
  }

  async getRandomVideoIdByEmotion(emotionType: EmotionType): Promise<string[] | null> {
    const videos = await this.youtubeApiRepository.find({
      where: { emotion : emotionType },
    });

    if (videos.length === 0) {
      this.logger.warn(`No videos found for emotion type: ${emotionType}`);
      return null;
    }

    const result:string[] = []

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * videos.length);
      result.push(videos[randomIndex].videoId)
    }

    return result
  }
}
