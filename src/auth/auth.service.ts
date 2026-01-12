import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MemberService } from '../member/member.service';
import { SocialType } from '../enums/social-type.enum';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private httpService: HttpService,
    private readonly memberService: MemberService,
  ) {
    const redisPort = this.configService.get<string>('REDIS_PORT');
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: redisPort ? parseInt(redisPort) : 6379,
    });
  }

  async validateOAuthLogin(oauthUser: any) {
    // DB에 유저 있는지 확인하고 없다면 생성
    const id: string = oauthUser.id;
    const nickname = oauthUser.nickname;
    const email = oauthUser.email;
    const socialType = oauthUser.type;
    if (!(await this.memberService.findSocialMember(id, socialType))) {
      // DB에 유저가 없다면
      this.logger.log(
        `회원가입 id : ${oauthUser.id}, nickname : ${oauthUser.nickname}, email : ${oauthUser.email}, socialType : ${oauthUser.type}`,
      );
      await this.memberService.create({
        id,
        nickname,
        email,
        socialType,
      });
    }

    const payload = { id: id, socialType: socialType, nickname: nickname };

    // Access Token (1시간)
    const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });

    // Refresh Token (24시간)
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '24h' },
    );

    // Redis에 Refresh Token 저장 (24시간 TTL = 86400초)
    await this.redis.set(`refresh:${id}`, refresh_token, 'EX', 86400);

    return {
      access_token,
      refresh_token,
    };
  }

  // Refresh Token으로 Access Token 재발급
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const userId = payload.id;

      const storedToken = await this.redis.get(`refresh:${userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // 새로운 토큰 발급
      const newPayload = {
        id: userId,
        socialType: payload.socialType,
        nickname: payload.nickname,
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '1h',
      });
      const newRefreshToken = this.jwtService.sign(
        { ...newPayload, type: 'refresh' },
        { expiresIn: '24h' },
      );

      // Redis 업데이트 (24시간 TTL)
      await this.redis.set(`refresh:${userId}`, newRefreshToken, 'EX', 86400);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
    return { success: true };
  }

  // 카카오 로그인
  async signInWithKakao(kakaoAuthResCode: string) {
    // Authorization Code로 Kakao API에 Access Token 요청
    const accessToken = await this.getKakaoAccessToken(kakaoAuthResCode);

    // Access Token으로 Kakao 사용자 정보 요청
    const kakaoUserInfo = await this.getKakaoUserInfo(accessToken);

    const id: string = kakaoUserInfo.id.toString();
    const nickname = kakaoUserInfo.properties.nickname;
    const email = kakaoUserInfo.kakao_account.email;
    // 카카오 사용자 정보를 기반으로 회원가입 또는 로그인 처리
    const tokens = await this.validateOAuthLogin({
      id,
      nickname,
      email,
      type: SocialType.KAKAO,
    });

    // [2] 사용자 정보 반환
    return { ...tokens };
  }

  // Kakao Authorization Code로 Access Token 요청
  async getKakaoAccessToken(code: string): Promise<string> {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    const payload = {
      grant_type: 'authorization_code',
      client_id: this.configService.get('KAKAO_CLIENT_ID'), // Kakao REST API Key
      redirect_uri: this.configService.get('KAKAO_REDIRECT_URI'),
      code,
    };

    const response = await firstValueFrom(
      this.httpService.post(tokenUrl, null, {
        params: payload,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    return response.data.access_token; // Access Token 반환
  }

  // Access Token으로 Kakao 사용자 정보 요청
  async getKakaoUserInfo(accessToken: string): Promise<any> {
    const userInfoUrl = 'https://kapi.kakao.com/v2/user/me';
    const response = await firstValueFrom(
      this.httpService.get(userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return response.data;
  }

  async demoLoginTemplate(id: string) {
    let nickname = '하루뒤';
    if (id === 'lee') nickname = '이순신';
    else if (id === 'harry') nickname = '해리포터';
    else if (id === 'traveler') nickname = '여행자';
    else if (id === 'anne') nickname = '안네';
    else if (id === 'namul') nickname = '정나물';

    const demoUser = {
      id: id,
      nickname: nickname,
      email: `${id}@example.com`,
      type: SocialType.DEMO,
    };

    let res = await this.validateOAuthLogin(demoUser);
    return res;
  }
}
