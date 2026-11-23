import { Ticket, TicketStatus } from '../domain/ticket';
import { TicketsRepository } from '../domain/tickets.repository';
import {
  TicketBatchConflictError,
  TicketFileUnavailableError,
  TicketNotFoundError,
} from './errors/tickets.errors';
import { TicketDocumentGenerator } from './ports/ticket-document.generator';
import { TicketMetadataGateway } from './ports/ticket-metadata.gateway';
import { IssueTicketsInput, TicketsService } from './tickets.service';

const input: IssueTicketsInput = {
  orderId: '30000000-0000-4000-8000-000000000001',
  customerId: '30000000-0000-4000-8000-000000000002',
  eventId: '30000000-0000-4000-8000-000000000003',
  sectorId: '30000000-0000-4000-8000-000000000004',
  quantity: 2,
};

describe('TicketsService', () => {
  let stored: Ticket[];
  let repository: jest.Mocked<TicketsRepository>;
  let documents: jest.Mocked<TicketDocumentGenerator>;
  let metadata: jest.Mocked<TicketMetadataGateway>;
  let service: TicketsService;

  beforeEach(() => {
    stored = [];
    repository = {
      findByOrder: jest.fn().mockImplementation(() => Promise.resolve(stored)),
      createBatch: jest.fn().mockImplementation((batch) => {
        stored = batch.tickets.map((ticket) => ({
          ...ticket,
          orderId: batch.orderId,
          customerId: batch.customerId,
          eventId: batch.eventId,
          sectorId: batch.sectorId,
          status: TicketStatus.VALID,
          issuedAt: new Date(),
        }));
        return Promise.resolve(stored);
      }),
      listByCustomer: jest
        .fn()
        .mockImplementation(() => Promise.resolve(stored)),
      findById: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(stored.find((ticket) => ticket.id === id) ?? null),
        ),
      findOwned: jest
        .fn()
        .mockImplementation(() => Promise.resolve(stored[0] ?? null)),
      findByCode: jest
        .fn()
        .mockImplementation(() => Promise.resolve(stored[0] ?? null)),
    };
    documents = {
      generate: jest
        .fn()
        .mockImplementation((data) => Promise.resolve(`${data.ticketId}.pdf`)),
      remove: jest.fn().mockResolvedValue(undefined),
      absolutePath: jest
        .fn()
        .mockImplementation((file) => `C:/tickets/${file}`),
      exists: jest.fn().mockResolvedValue(true),
    };
    metadata = {
      get: jest.fn().mockResolvedValue({
        eventName: 'Concierto de prueba',
        startsAt: new Date('2030-12-20T20:00:00Z'),
        venueName: 'Teatro Central',
        venueAddress: 'Av. Principal 123',
        sectorName: 'VIP',
        customerName: 'Cliente Prueba',
      }),
    };
    service = new TicketsService(repository, documents, metadata);
  });

  it('emite un código y PDF independiente por unidad', async () => {
    const result = await service.issue(input);

    expect(result).toHaveLength(2);
    expect(new Set(result.map((ticket) => ticket.code)).size).toBe(2);
    expect(result.every((ticket) => ticket.code.length >= 32)).toBe(true);
    expect(documents.generate).toHaveBeenCalledTimes(2);
    expect(repository.createBatch).toHaveBeenCalledTimes(1);
  });

  it('devuelve las entradas existentes al repetir la misma orden', async () => {
    const first = await service.issue(input);
    const repeated = await service.issue(input);

    expect(repeated.map((ticket) => ticket.id)).toEqual(
      first.map((ticket) => ticket.id),
    );
    expect(repository.createBatch).toHaveBeenCalledTimes(1);
    expect(documents.generate).toHaveBeenCalledTimes(2);
  });

  it('rechaza un reintento con otra cantidad', async () => {
    await service.issue(input);

    await expect(
      service.issue({ ...input, quantity: 1 }),
    ).rejects.toBeInstanceOf(TicketBatchConflictError);
  });

  it('solo resuelve la descarga para el propietario y un archivo existente', async () => {
    const [ticket] = await service.issue(input);
    const file = await service.download(ticket.id, input.customerId);

    expect(file.path).toBe(`C:/tickets/${ticket.id}.pdf`);
    expect(file.name).toBe(`entrada-${ticket.id}.pdf`);
  });

  it('resuelve el PDF por entrada para uso interno sin cliente', async () => {
    const [ticket] = await service.issue(input);
    const file = await service.document(ticket.id);

    expect(file.path).toBe(`C:/tickets/${ticket.id}.pdf`);
    expect(file.name).toBe(`entrada-${ticket.id}.pdf`);
    expect(repository.findOwned).not.toHaveBeenCalled();
  });

  it('rechaza el PDF interno cuando la entrada no existe', async () => {
    await expect(
      service.document('30000000-0000-4000-8000-000000000099'),
    ).rejects.toBeInstanceOf(TicketNotFoundError);
  });

  it('rechaza el PDF interno cuando el archivo no está disponible', async () => {
    const [ticket] = await service.issue(input);
    documents.exists.mockResolvedValue(false);

    await expect(service.document(ticket.id)).rejects.toBeInstanceOf(
      TicketFileUnavailableError,
    );
  });

  it('valida el código sin exponer datos personales', async () => {
    const [ticket] = await service.issue(input);
    const result = await service.validateCode(ticket.code);

    expect(result).toEqual({
      valid: true,
      ticketId: ticket.id,
      eventId: input.eventId,
      status: TicketStatus.VALID,
    });
    expect(result).not.toHaveProperty('customerId');
  });
});
