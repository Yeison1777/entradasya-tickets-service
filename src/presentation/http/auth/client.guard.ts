import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { AuthUser } from './auth-user';

@Injectable()
export class ClientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    return (request.user as AuthUser | undefined)?.role === 'CLIENT';
  }
}
