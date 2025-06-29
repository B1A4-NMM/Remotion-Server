import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 jwt에서 user를 가져오는 커스텀 데코레이터
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
