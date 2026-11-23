import { Ticket } from './ticket';

export const TICKETS_REPOSITORY = Symbol('TICKETS_REPOSITORY');

export interface IssueBatchData {
  orderId: string;
  customerId: string;
  eventId: string;
  sectorId: string;
  quantity: number;
  tickets: Array<{
    id: string;
    sequence: number;
    code: string;
    pdfPath: string;
  }>;
}

export interface TicketsRepository {
  findByOrder(orderId: string): Promise<Ticket[]>;
  createBatch(data: IssueBatchData): Promise<Ticket[]>;
  listByCustomer(customerId: string): Promise<Ticket[]>;
  findById(id: string): Promise<Ticket | null>;
  findOwned(id: string, customerId: string): Promise<Ticket | null>;
  findByCode(code: string): Promise<Ticket | null>;
}
