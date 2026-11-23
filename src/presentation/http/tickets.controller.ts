import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { TicketsService } from '../../application/tickets.service';
import type { AuthUser } from './auth/auth-user';
import { ClientGuard } from './auth/client.guard';
import { CurrentUser } from './auth/current-user.decorator';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('tickets')
@UseGuards(JwtAuthGuard, ClientGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.tickets.list(user.sub);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.tickets.download(id, user.sub);
    response.download(file.path, file.name);
  }
}
