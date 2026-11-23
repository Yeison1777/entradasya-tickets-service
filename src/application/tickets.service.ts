import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';

import { Ticket, TicketStatus } from '../domain/ticket';
import { TICKETS_REPOSITORY } from '../domain/tickets.repository';
import type {
  IssueBatchData,
  TicketsRepository,
} from '../domain/tickets.repository';
import {
  TicketBatchAlreadyExistsError,
  TicketBatchConflictError,
  TicketCodeNotFoundError,
  TicketFileUnavailableError,
  TicketNotFoundError,
} from './errors/tickets.errors';
import { TICKET_DOCUMENT_GENERATOR } from './ports/ticket-document.generator';
import type { TicketDocumentGenerator } from './ports/ticket-document.generator';
import { TICKET_METADATA_GATEWAY } from './ports/ticket-metadata.gateway';
import type { TicketMetadataGateway } from './ports/ticket-metadata.gateway';

export interface IssueTicketsInput {
  orderId: string;
  customerId: string;
  eventId: string;
  sectorId: string;
  quantity: number;
}

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly tickets: TicketsRepository,
    @Inject(TICKET_DOCUMENT_GENERATOR)
    private readonly documents: TicketDocumentGenerator,
    @Inject(TICKET_METADATA_GATEWAY)
    private readonly metadata: TicketMetadataGateway,
  ) {}

  async issue(input: IssueTicketsInput): Promise<Ticket[]> {
    const existing = await this.tickets.findByOrder(input.orderId);
    if (existing.length > 0) return this.validateExisting(existing, input);

    const metadata = await this.metadata.get(
      input.eventId,
      input.sectorId,
      input.customerId,
    );
    const seeds: IssueBatchData['tickets'] = [];
    try {
      for (let sequence = 1; sequence <= input.quantity; sequence += 1) {
        const id = randomUUID();
        const code = randomBytes(32).toString('base64url');
        const pdfPath = await this.documents.generate({
          ticketId: id,
          code,
          ...metadata,
        });
        seeds.push({ id, sequence, code, pdfPath });
      }
      return await this.tickets.createBatch({ ...input, tickets: seeds });
    } catch (error) {
      await this.cleanup(seeds);
      if (error instanceof TicketBatchAlreadyExistsError) {
        const winner = await this.tickets.findByOrder(input.orderId);
        return this.validateExisting(winner, input);
      }
      throw error;
    }
  }

  list(customerId: string): Promise<Ticket[]> {
    return this.tickets.listByCustomer(customerId);
  }

  listByOrder(orderId: string): Promise<Ticket[]> {
    return this.tickets.findByOrder(orderId);
  }

  async download(
    id: string,
    customerId: string,
  ): Promise<{ path: string; name: string }> {
    const ticket = await this.tickets.findOwned(id, customerId);
    if (!ticket) throw new TicketNotFoundError();
    return this.resolveDocument(ticket);
  }

  async document(id: string): Promise<{ path: string; name: string }> {
    const ticket = await this.tickets.findById(id);
    if (!ticket) throw new TicketNotFoundError();
    return this.resolveDocument(ticket);
  }

  async validateCode(code: string) {
    const ticket = await this.tickets.findByCode(code);
    if (!ticket) throw new TicketCodeNotFoundError();
    return {
      valid: ticket.status === TicketStatus.VALID,
      ticketId: ticket.id,
      eventId: ticket.eventId,
      status: ticket.status,
    };
  }

  private async resolveDocument(
    ticket: Ticket,
  ): Promise<{ path: string; name: string }> {
    if (!(await this.documents.exists(ticket.pdfPath))) {
      throw new TicketFileUnavailableError();
    }
    return {
      path: this.documents.absolutePath(ticket.pdfPath),
      name: `entrada-${ticket.id}.pdf`,
    };
  }

  private validateExisting(
    existing: Ticket[],
    input: IssueTicketsInput,
  ): Ticket[] {
    const first = existing[0];
    if (
      !first ||
      existing.length !== input.quantity ||
      first.customerId !== input.customerId ||
      first.eventId !== input.eventId ||
      first.sectorId !== input.sectorId
    ) {
      throw new TicketBatchConflictError();
    }
    return existing;
  }

  private async cleanup(seeds: IssueBatchData['tickets']): Promise<void> {
    await Promise.allSettled(
      seeds.map((ticket) => this.documents.remove(ticket.pdfPath)),
    );
  }
}
