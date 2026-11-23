import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { TicketsService } from '../../application/tickets.service';
import { InternalApiKeyGuard } from './auth/internal-api-key.guard';
import { IssueTicketsDto } from './dto/issue-tickets.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';

@Controller('internal/tickets')
@UseGuards(InternalApiKeyGuard)
export class InternalTicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post('issue')
  issue(@Body() input: IssueTicketsDto) {
    return this.tickets.issue(input);
  }

  @Post('validate')
  validate(@Body() input: ValidateTicketDto) {
    return this.tickets.validateCode(input.code);
  }

  @Get('orders/:orderId')
  byOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.tickets.listByOrder(orderId);
  }

  @Get(':id/pdf')
  async document(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.tickets.document(id);
    response.download(file.path, file.name);
  }
}
