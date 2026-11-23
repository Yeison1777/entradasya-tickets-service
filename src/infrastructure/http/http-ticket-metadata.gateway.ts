import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TicketDependencyError } from '../../application/errors/tickets.errors';
import {
  TicketMetadata,
  TicketMetadataGateway,
} from '../../application/ports/ticket-metadata.gateway';

interface EventMetadataResponse {
  eventName: string;
  startsAt: string;
  venueName: string;
  venueAddress: string;
  sectorName: string;
}

interface UserResponse {
  name: string;
}

@Injectable()
export class HttpTicketMetadataGateway implements TicketMetadataGateway {
  private readonly authUrl: string;
  private readonly eventsUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: ConfigService) {
    this.authUrl = config.getOrThrow<string>('AUTH_SERVICE_URL');
    this.eventsUrl = config.getOrThrow<string>('EVENTS_SERVICE_URL');
    this.apiKey = config.getOrThrow<string>('INTERNAL_API_KEY');
    this.timeout = config.get<number>('HTTP_TIMEOUT_MS', 3000);
  }

  async get(
    eventId: string,
    sectorId: string,
    customerId: string,
  ): Promise<TicketMetadata> {
    const [event, customer] = await Promise.all([
      this.request<EventMetadataResponse>(
        `${this.eventsUrl}/internal/events/${eventId}/ticket-metadata/${sectorId}`,
        'events-service',
      ),
      this.request<UserResponse>(
        `${this.authUrl}/internal/users/${customerId}`,
        'auth-service',
      ),
    ]);
    return {
      ...event,
      startsAt: new Date(event.startsAt),
      customerName: customer.name,
    };
  }

  private async request<T>(url: string, dependency: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'x-internal-api-key': this.apiKey },
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch {
      throw new TicketDependencyError(dependency);
    }
    if (!response.ok) throw new TicketDependencyError(dependency);
    try {
      return (await response.json()) as T;
    } catch {
      throw new TicketDependencyError(dependency);
    }
  }
}
