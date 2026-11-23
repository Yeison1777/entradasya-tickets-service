import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { TicketsService } from './application/tickets.service';
import { TICKET_DOCUMENT_GENERATOR } from './application/ports/ticket-document.generator';
import { TICKET_METADATA_GATEWAY } from './application/ports/ticket-metadata.gateway';
import { TICKETS_REPOSITORY } from './domain/tickets.repository';
import { validateEnvironment } from './infrastructure/config/environment';
import { PrismaService } from './infrastructure/database/prisma.service';
import { PrismaTicketsRepository } from './infrastructure/database/prisma-tickets.repository';
import { PdfTicketDocumentGenerator } from './infrastructure/documents/pdf-ticket-document.generator';
import { HttpTicketMetadataGateway } from './infrastructure/http/http-ticket-metadata.gateway';
import { ClientGuard } from './presentation/http/auth/client.guard';
import { InternalApiKeyGuard } from './presentation/http/auth/internal-api-key.guard';
import { JwtStrategy } from './presentation/http/auth/jwt.strategy';
import { HealthController } from './presentation/http/health.controller';
import { InternalTicketsController } from './presentation/http/internal-tickets.controller';
import { TicketsController } from './presentation/http/tickets.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [InternalTicketsController, TicketsController, HealthController],
  providers: [
    TicketsService,
    PrismaService,
    PrismaTicketsRepository,
    PdfTicketDocumentGenerator,
    HttpTicketMetadataGateway,
    JwtStrategy,
    ClientGuard,
    InternalApiKeyGuard,
    { provide: TICKETS_REPOSITORY, useExisting: PrismaTicketsRepository },
    {
      provide: TICKET_DOCUMENT_GENERATOR,
      useExisting: PdfTicketDocumentGenerator,
    },
    {
      provide: TICKET_METADATA_GATEWAY,
      useExisting: HttpTicketMetadataGateway,
    },
  ],
})
export class AppModule {}
