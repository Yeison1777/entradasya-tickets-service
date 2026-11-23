export enum TicketStatus {
  VALID = 'VALID',
  CANCELLED = 'CANCELLED',
}

export interface Ticket {
  id: string;
  orderId: string;
  customerId: string;
  eventId: string;
  sectorId: string;
  sequence: number;
  code: string;
  status: TicketStatus;
  pdfPath: string;
  issuedAt: Date;
}
