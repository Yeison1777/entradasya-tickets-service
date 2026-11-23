import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  TicketBatchConflictError,
  TicketCodeNotFoundError,
  TicketDependencyError,
  TicketFileUnavailableError,
  TicketNotFoundError,
} from '../../application/errors/tickets.errors';

type TicketsError =
  | TicketBatchConflictError
  | TicketCodeNotFoundError
  | TicketDependencyError
  | TicketFileUnavailableError
  | TicketNotFoundError;

@Catch(
  TicketBatchConflictError,
  TicketCodeNotFoundError,
  TicketDependencyError,
  TicketFileUnavailableError,
  TicketNotFoundError,
)
export class TicketsExceptionFilter implements ExceptionFilter<TicketsError> {
  catch(exception: TicketsError, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const result = this.describe(exception);
    response.status(result.statusCode).json({
      ...result,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private describe(error: TicketsError): { statusCode: number; code: string } {
    if (error instanceof TicketCodeNotFoundError) {
      return { statusCode: HttpStatus.NOT_FOUND, code: 'INVALID_CODE' };
    }
    if (error instanceof TicketNotFoundError) {
      return { statusCode: HttpStatus.NOT_FOUND, code: 'TICKET_NOT_FOUND' };
    }
    if (error instanceof TicketBatchConflictError) {
      return { statusCode: HttpStatus.CONFLICT, code: 'IDEMPOTENCY_CONFLICT' };
    }
    if (error instanceof TicketFileUnavailableError) {
      return { statusCode: HttpStatus.NOT_FOUND, code: 'PDF_NOT_FOUND' };
    }
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'DEPENDENCY_UNAVAILABLE',
    };
  }
}
