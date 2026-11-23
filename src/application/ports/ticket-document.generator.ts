export const TICKET_DOCUMENT_GENERATOR = Symbol('TICKET_DOCUMENT_GENERATOR');

export interface TicketDocumentData {
  ticketId: string;
  code: string;
  eventName: string;
  startsAt: Date;
  venueName: string;
  venueAddress: string;
  sectorName: string;
  customerName: string;
}

export interface TicketDocumentGenerator {
  generate(data: TicketDocumentData): Promise<string>;
  remove(relativePath: string): Promise<void>;
  absolutePath(relativePath: string): string;
  exists(relativePath: string): Promise<boolean>;
}
