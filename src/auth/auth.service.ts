// auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MemberService } from '../member/member.service';
import { SocialType } from '../enums/social-type.enum';
import { CreateMemberDto } from '../member/dto/create-member.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private httpService: HttpService,
    private readonly memberService: MemberService
  ) {}

  async validateOAuthLogin(oauthUser: any) {
    // DB에 유저 있는지 확인하고 없다면 생성
    const id = oauthUser.id
    const nickname = oauthUser.nickname
    const email = oauthUser.email
    const socialType = oauthUser.type
    if (!await this.memberService.findSocialMember(id, socialType)){ // DB에 유저가 없다면
      await this.memberService.create({
        id, nickname, email, socialType
      })
    }

    const payload = { id: id, socialType:socialType };
    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  // 카카오 로그인
  async signInWithKakao(kakaoAuthResCode: string) {
    // Authorization Code로 Kakao API에 Access Token 요청
    const accessToken = await this.getKakaoAccessToken(kakaoAuthResCode);

    // Access Token으로 Kakao 사용자 정보 요청
    const kakaoUserInfo = await this.getKakaoUserInfo(accessToken);

    const id = kakaoUserInfo.id
    const nickname = kakaoUserInfo.properties.nickname
    const email = kakaoUserInfo.kakao_account.email
    // 카카오 사용자 정보를 기반으로 회원가입 또는 로그인 처리
    const jwtToken = await this.validateOAuthLogin(
      {
        id,
        nickname,
        email,
        type: SocialType.KAKAO
      }
    );

    // [2] 사용자 정보 반환
    return { jwtToken };
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
}
