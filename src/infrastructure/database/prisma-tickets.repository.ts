import { Injectable } from '@nestjs/common';

import { Ticket, TicketStatus } from '../../domain/ticket';
import {
  IssueBatchData,
  TicketsRepository,
} from '../../domain/tickets.repository';
import { TicketBatchAlreadyExistsError } from '../../application/errors/tickets.errors';
import {
  Prisma,
  Ticket as PrismaTicket,
  TicketBatch,
} from '../../generated/prisma/client';
import { PrismaService } from './prisma.service';

type TicketWithBatch = PrismaTicket & { batch: TicketBatch };

@Injectable()
export class PrismaTicketsRepository implements TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrder(orderId: string): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { batch: { orderId } },
      include: { batch: true },
      orderBy: { sequence: 'asc' },
    });
    return tickets.map((ticket) => this.toDomain(ticket));
  }

  async createBatch(data: IssueBatchData): Promise<Ticket[]> {
    try {
      const batch = await this.prisma.ticketBatch.create({
        data: {
          orderId: data.orderId,
          customerId: data.customerId,
          eventId: data.eventId,
          sectorId: data.sectorId,
          quantity: data.quantity,
          tickets: { create: data.tickets },
        },
        include: { tickets: { orderBy: { sequence: 'asc' } } },
      });
      return batch.tickets.map((ticket) => this.toDomain({ ...ticket, batch }));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new TicketBatchAlreadyExistsError();
      }
      throw error;
    }
  }

  async listByCustomer(customerId: string): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { batch: { customerId } },
      include: { batch: true },
      orderBy: { issuedAt: 'desc' },
    });
    return tickets.map((ticket) => this.toDomain(ticket));
  }

  async findById(id: string): Promise<Ticket | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { batch: true },
    });
    return ticket ? this.toDomain(ticket) : null;
  }

  async findOwned(id: string, customerId: string): Promise<Ticket | null> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, batch: { customerId } },
      include: { batch: true },
    });
    return ticket ? this.toDomain(ticket) : null;
  }

  async findByCode(code: string): Promise<Ticket | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { code },
      include: { batch: true },
    });
    return ticket ? this.toDomain(ticket) : null;
  }

  private toDomain(ticket: TicketWithBatch): Ticket {
    return {
      id: ticket.id,
      orderId: ticket.batch.orderId,
      customerId: ticket.batch.customerId,
      eventId: ticket.batch.eventId,
      sectorId: ticket.batch.sectorId,
      sequence: ticket.sequence,
      code: ticket.code,
      status: ticket.status as TicketStatus,
      pdfPath: ticket.pdfPath,
      issuedAt: ticket.issuedAt,
    };
  }
}
