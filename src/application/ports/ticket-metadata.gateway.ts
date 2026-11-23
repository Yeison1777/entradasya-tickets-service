export const TICKET_METADATA_GATEWAY = Symbol('TICKET_METADATA_GATEWAY');

export interface TicketMetadata {
  eventName: string;
  startsAt: Date;
  venueName: string;
  venueAddress: string;
  sectorName: string;
  customerName: string;
}

export interface TicketMetadataGateway {
  get(
    eventId: string,
    sectorId: string,
    customerId: string,
  ): Promise<TicketMetadata>;
}
