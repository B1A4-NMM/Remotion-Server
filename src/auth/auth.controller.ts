// auth.controller.ts
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    return 'redirecting to Google...';
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req) {
    return this.authService.validateOAuthLogin(req.user); // JWT 반환
  }

  @Get('test')
  @UseGuards(AuthGuard('jwt')) // JWT가 없으면 401 Unauthorized
  async testJwt(@Req() req: Request) {
    return {
      message: 'JWT 인증이 성공적으로 완료되었습니다.',
    };
  }

  // 카카오 로그인 페이지 요청
  @Get('/kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin(@Req() req: Request) {
    // 이 부분은 Passport의 AuthGuard에 의해 카카오 로그인 페이지로 리다이렉트
  }

  // 카카오 로그인 콜백 엔드포인트
  @Get('kakao/redirect')
  async kakaoCallback(@Query('code') kakaoAuthResCode: string) {  // Authorization Code 받기
    console.log("kakaoAuthResCode : ", kakaoAuthResCode, "")
    const { jwtToken } = await this.authService.signInWithKakao(kakaoAuthResCode);

    console.log("complete kakao")
    return jwtToken.access_token;
  }
}
