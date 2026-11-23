import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { PdfTicketDocumentGenerator } from './pdf-ticket-document.generator';

describe('PdfTicketDocumentGenerator', () => {
  let directory: string;
  let generator: PdfTicketDocumentGenerator;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'entradasya-ticket-'));
    const config = {
      getOrThrow: jest.fn().mockReturnValue(directory),
    } as unknown as ConfigService;
    generator = new PdfTicketDocumentGenerator(config);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('genera un PDF real con un QR embebido', async () => {
    const relativePath = await generator.generate({
      ticketId: '30000000-0000-4000-8000-000000000010',
      code: 'codigo_seguro_de_prueba_12345678901234567890',
      eventName: 'Concierto de prueba',
      startsAt: new Date('2030-12-20T20:00:00Z'),
      venueName: 'Teatro Central',
      venueAddress: 'Av. Principal 123',
      sectorName: 'VIP',
      customerName: 'Cliente Prueba',
    });
    const absolutePath = generator.absolutePath(relativePath);
    const header = (await readFile(absolutePath)).subarray(0, 4).toString();

    expect(header).toBe('%PDF');
    expect((await stat(absolutePath)).size).toBeGreaterThan(1000);
  });
});
