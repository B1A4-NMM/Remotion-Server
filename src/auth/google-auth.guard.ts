import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context) {
    const req = context.switchToHttp().getRequest();
    const state = req.query.state;
    return { state }; // 우리가 넘긴 redirect_uri 그대로 전달
  }
}