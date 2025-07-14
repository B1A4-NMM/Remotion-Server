// auth.controller.ts
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from './user.decorator';
import { use } from 'passport';
import { SocialType } from '../enums/social-type.enum';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ApiExcludeController, ApiExcludeEndpoint, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './google-auth.guard';
import { KakaoAuthGuard } from './kakao-auth.guard';

@Controller('auth')
@ApiTags('소셜 로그인')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    ) {}

  @ApiOperation({
    summary: "구글 소셜 로그인",
    description: "구글 소셜 로그인을 위해서 이 api에 리다이렉트를 걸어주세요. " +
      "로그인이 성공하면 /getaccess?access={jwt} 로 리다이렉트 됩니다." +
      "쿼리스트링을 통해 액세스 토큰을 받을 수 있습니다"})
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    return 'redirecting to Google...';
  }

  @ApiExcludeEndpoint()
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req:any, @Res() res:Response) {
    const user = req.user;
    const jwt = await this.authService.validateOAuthLogin({
      id: user.id,
      email: user.email,
      nickname: user.name,
      type: SocialType.GOOGLE,
    }); // JWT 반환

    // ✅ 프론트에서 넘긴 state (redirect_uri)가 user.state에 들어있음
    const redirectUri = decodeURIComponent(user.state || this.configService.get('FRONTEND_URL'));

    // ✅ /getaccess 경로 포함해서 리다이렉트
    const url = `${redirectUri}/getaccess?access=${jwt.access_token}`;

    return res.redirect(url);
  }

  @ApiOperation({summary: "로그인 테스트", description: "로그인되어 있다면 200 OK, 그렇지 않다면 401 Unauthorized 반환"})
  @Get('test')
  @UseGuards(AuthGuard('jwt')) // JWT가 없으면 401 Unauthorized
  async testJwt(@CurrentUser() user) {
    return {
      message: 'JWT 인증이 성공적으로 완료되었습니다.',
      user, // JWT에서 파싱된 user 정보
    };
  }

  // 카카오 로그인 페이지 요청
  @ApiOperation({
    summary: "카카오 소셜 로그인",
    description: "카카오 소셜 로그인을 위해서 이 api에 리다이렉트를 걸어주세요. " +
      "로그인이 성공하면 /getaccess?access={jwt} 로 리다이렉트 됩니다." +
      "쿼리스트링을 통해 액세스 토큰을 받을 수 있습니다"})
  @Get('/kakao')
  @UseGuards(KakaoAuthGuard)
  async kakaoLogin(@Req() req: Request) {

    // 이 부분은 Passport의 AuthGuard에 의해 카카오 로그인 페이지로 리다이렉트
  }

  // 카카오 로그인 콜백 엔드포인트
  @ApiExcludeEndpoint()
  @Get('kakao/redirect')
  async kakaoCallback(
    @Query('code') kakaoAuthResCode: string,
    @Res() res: Response,
    @Req() req: any,
    ) {
    // Authorization Code 받기
    const { jwtToken } =
      await this.authService.signInWithKakao(kakaoAuthResCode);

    // ✅ 프론트에서 넘긴 state (redirect_uri)가 user.state에 들어있음
    const redirectUri = decodeURIComponent(req.session.state || this.configService.get('FRONTEND_URL'));

    // ✅ /getaccess 경로 포함해서 리다이렉트
    const url = `${redirectUri}/getaccess?access=${jwtToken.access_token}`;

    delete req.session.state; // 세션에 담겨있는 리다이렉트 경로 삭제
    return res.redirect(url);
  }
}
