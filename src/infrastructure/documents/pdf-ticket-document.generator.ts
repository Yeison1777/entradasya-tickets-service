import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

import {
  TicketDocumentData,
  TicketDocumentGenerator,
} from '../../application/ports/ticket-document.generator';

@Injectable()
export class PdfTicketDocumentGenerator implements TicketDocumentGenerator {
  private readonly storagePath: string;

  constructor(config: ConfigService) {
    this.storagePath = path.resolve(
      config.getOrThrow<string>('TICKETS_STORAGE_PATH'),
    );
  }

  async generate(data: TicketDocumentData): Promise<string> {
    await mkdir(this.storagePath, { recursive: true });
    const relativePath = `${data.ticketId}.pdf`;
    const finalPath = this.absolutePath(relativePath);
    const temporaryPath = `${finalPath}.tmp`;
    const qr = await QRCode.toBuffer(data.code, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 230,
    });

    try {
      await this.writePdf(temporaryPath, data, qr);
      await rename(temporaryPath, finalPath);
      return relativePath;
    } catch (error) {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async remove(relativePath: string): Promise<void> {
    await rm(this.absolutePath(relativePath), { force: true });
  }

  absolutePath(relativePath: string): string {
    if (path.basename(relativePath) !== relativePath) {
      throw new Error('Ruta de entrada inválida.');
    }
    return path.join(this.storagePath, relativePath);
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await access(this.absolutePath(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  private writePdf(
    target: string,
    data: TicketDocumentData,
    qr: Buffer,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ size: 'A4', margin: 54 });
      const output = createWriteStream(target, { flags: 'wx' });
      output.on('finish', resolve);
      output.on('error', reject);
      document.on('error', reject);
      document.pipe(output);

      document.fontSize(11).fillColor('#ef4444').text('ENTRADASYA');
      document.moveDown(0.5);
      document.fontSize(26).fillColor('#111827').text(data.eventName);
      document.moveDown(0.6);
      document
        .fontSize(12)
        .fillColor('#374151')
        .text(`Fecha: ${data.startsAt.toLocaleString('es-BO')}`)
        .text(`Lugar: ${data.venueName}`)
        .text(`Dirección: ${data.venueAddress}`)
        .text(`Sector: ${data.sectorName} — ubicación libre`)
        .text(`Cliente: ${data.customerName}`);
      document.moveDown(1);
      document
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`Entrada: ${data.ticketId}`);
      document.image(qr, { fit: [230, 230], align: 'center' });
      document.moveDown(0.5);
      document
        .fontSize(9)
        .fillColor('#111827')
        .text(`Código: ${data.code}`, { align: 'center' });
      document.moveDown(1);
      document
        .fontSize(11)
        .fillColor('#b91c1c')
        .text('Este código permite un solo ingreso. No lo compartas.', {
          align: 'center',
        });
      document.end();
    });
  }
}
