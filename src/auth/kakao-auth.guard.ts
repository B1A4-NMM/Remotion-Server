// kakao-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const redirectUri = request.query.state;

    if (redirectUri) {
      request.session.state = redirectUri
    }

    return super.canActivate(context);
  }
}
