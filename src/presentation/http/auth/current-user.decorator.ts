import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { AuthUser } from './auth-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<Request>().user as AuthUser,
);
