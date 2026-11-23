import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  live() {
    return { service: 'tickets-service', status: 'ok' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { service: 'tickets-service', status: 'ready' };
    } catch {
      throw new ServiceUnavailableException({
        service: 'tickets-service',
        status: 'not-ready',
      });
    }
  }
}
