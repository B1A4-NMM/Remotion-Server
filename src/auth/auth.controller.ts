import { Body, Controller, Get, Post, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
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

  // 쿠키 설정 헬퍼 메서드
  private setRefreshCookie(res: Response, refreshToken: string) {
    const isProduction = process.env.ENVIRONMENT === 'develop';
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction, // 배포 환경에서는 무조건 Secure
      sameSite: isProduction ? 'none' : 'lax', // 배포 환경에서는 None (서브도메인 간 공유를 위해)
      path: '/',
      // ✅ 핵심 수정: 배포 환경에서는 .harudew.site 도메인 설정 (모든 서브도메인 공유)
      domain: isProduction ? '.harudew.site' : undefined,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  @ApiOperation({
    summary: "구글 소셜 로그인",
    description: "구글 소셜 로그인을 위해서 이 api에 리다이렉트를 걸어주세요. " +
      "로그인이 성공하면 /getaccess?access={jwt} 로 리다이렉트 됩니다. (Refresh Token은 쿠키로 설정됨)"})
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
    const tokens = await this.authService.validateOAuthLogin({
      id: user.id,
      email: user.email,
      nickname: user.name,
      type: SocialType.GOOGLE,
    }); 

    // Refresh Token 쿠키 설정
    this.setRefreshCookie(res, tokens.refresh_token);

    // ✅ 프론트에서 넘긴 state (redirect_uri)가 user.state에 들어있음
    const redirectUri = decodeURIComponent(user.state || this.configService.get('FRONTEND_URL'));

    // ✅ /getaccess 경로 포함해서 리다이렉트 (Access Token만 쿼리로 전달)
    const url = `${redirectUri}/getaccess?access=${tokens.access_token}`;

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
      "로그인이 성공하면 /getaccess?access={jwt} 로 리다이렉트 됩니다. (Refresh Token은 쿠키로 설정됨)"})
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
    const tokens =
      await this.authService.signInWithKakao(kakaoAuthResCode);

    // Refresh Token 쿠키 설정
    this.setRefreshCookie(res, tokens.refresh_token);

    // ✅ 프론트에서 넘긴 state (redirect_uri)가 user.state에 들어있음
    const redirectUri = decodeURIComponent(req.session.state || this.configService.get('FRONTEND_URL'));

    // ✅ /getaccess 경로 포함해서 리다이렉트 (Access Token만 쿼리로 전달)
    const url = `${redirectUri}/getaccess?access=${tokens.access_token}`;

    delete req.session.state; // 세션에 담겨있는 리다이렉트 경로 삭제
    return res.redirect(url);
  }

  @ApiOperation({
    summary: '데모 계정 로그인',
    description: '데모 계정으로 로그인하여 JWT를 발급받습니다. id를 쿼리스트링으로 받아, 해당 데모 id가 있다면 로그인, 없다면 회원가입합니다',
  })
  @Get('demo')
  async demoLogin(
    @Query('id') id: string,
    @Res() res: Response
  ) {
    const tokens = await this.authService.demoLoginTemplate(id);
    
    // Refresh Token 쿠키 설정
    this.setRefreshCookie(res, tokens.refresh_token);
    
    return res.json({
      access_token: tokens.access_token
    });
  }

  @ApiOperation({ summary: '토큰 갱신', description: '쿠키에 저장된 Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.' })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const tokens = await this.authService.refresh(refreshToken);
    
    // 갱신된 Refresh Token 쿠키 설정 (Rotate)
    this.setRefreshCookie(res, tokens.refresh_token);

    return { access_token: tokens.access_token };
  }

  @ApiOperation({ summary: '로그아웃', description: 'Refresh Token 쿠키를 삭제하고 로그아웃 처리합니다.' })
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@CurrentUser() user, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    
    // 쿠키 삭제 (설정할 때와 동일한 옵션 필요)
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      domain: isProduction ? '.harudew.site' : undefined, // 도메인도 맞춰줘야 삭제됨
    });
    
    return { success: true };
  }
}
