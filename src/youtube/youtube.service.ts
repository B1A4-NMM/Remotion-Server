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
    await this.searchAndStoreVideos();
  }

  async searchAndStoreVideos(): Promise<void> {
    this.logger.log('Starting YouTube video search and storage...');
    for (const emotionTypeKey in EMOTION_YOUTUBE_KEYWORDS) {
      const emotionType: EmotionType = emotionTypeKey as EmotionType; // 타입 캐스팅
      const searchKeywords = EMOTION_YOUTUBE_KEYWORDS[emotionType];

      for (const searchKeyword of searchKeywords) {
        try {
          const videoIds = await this.searchYoutubeVideos(searchKeyword);
          for (const videoId of videoIds) {
            await this.saveVideoId(emotionType, searchKeyword, videoId);
          }
        } catch (error) {
          this.logger.error(
            `Failed to search or store videos for keyword "${searchKeyword}" (EmotionType: ${emotionType}): ${error.message}`,
            error.stack,
          );
        }
      }
    }
    this.logger.log('YouTube video search and storage completed.');
  }

  private async searchYoutubeVideos(query: string): Promise<string[]> {
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
        .map((item) => item.id.videoId);
    } catch (error) {
      this.logger.error(
        `Error searching YouTube for "${query}": ${error.message}`,
      );
      throw error;
    }
  }

  private async saveVideoId(
    emotionType: EmotionType, // 타입 변경
    searchKeyword: string, // 타입 변경
    videoId: string,
  ): Promise<void> {
    const existingVideo = await this.youtubeApiRepository.findOne({
      where: { videoId },
    });

    if (!existingVideo) {
      const newVideo = this.youtubeApiRepository.create({
        emotionType,
        searchKeyword,
        videoId,
      });
      await this.youtubeApiRepository.save(newVideo);
      this.logger.log(
        `Saved new video ID: ${videoId} for EmotionType: ${emotionType}, SearchKeyword: ${searchKeyword}`,
      );
    } else {
      this.logger.debug(`Video ID ${videoId} already exists. Skipping.`);
    }
  }

  async getRandomVideoIdByEmotion(emotionType: EmotionType): Promise<string | null> { // 타입 변경
    const videos = await this.youtubeApiRepository.find({
      where: { emotionType },
    });

    if (videos.length === 0) {
      this.logger.warn(`No videos found for emotion type: ${emotionType}`);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * videos.length);
    return videos[randomIndex].videoId;
  }
}