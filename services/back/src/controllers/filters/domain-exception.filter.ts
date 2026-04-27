import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../core/domain/errors';

const KIND_TO_STATUS: Record<string, number> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  VALIDATION: HttpStatus.BAD_REQUEST,
};

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof DomainError) {
      const status = KIND_TO_STATUS[exception.kind] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({
        error: { code: exception.code, message: exception.message },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (
        body &&
        typeof body === 'object' &&
        'error' in body &&
        body.error &&
        typeof (body as { error: unknown }).error === 'object'
      ) {
        res.status(status).json(body);
        return;
      }
      const message =
        typeof body === 'string'
          ? body
          : (body as { message?: string | string[] })?.message
          ? Array.isArray((body as { message: string[] }).message)
            ? (body as { message: string[] }).message.join('; ')
            : ((body as { message: string }).message as string)
          : exception.message;
      res.status(status).json({
        error: { code: defaultCode(status), message },
      });
      return;
    }

    // Unknown error
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
}

const defaultCode = (status: number): string => {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return 'ERROR';
  }
};
