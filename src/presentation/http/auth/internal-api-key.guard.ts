import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, unknown> }>();
    const received = request.headers['x-internal-api-key'];
    const expected = this.config.getOrThrow<string>('INTERNAL_API_KEY');
    if (typeof received !== 'string' || !this.equals(received, expected)) {
      throw new UnauthorizedException('Credencial interna inválida.');
    }
    return true;
  }

  private equals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
