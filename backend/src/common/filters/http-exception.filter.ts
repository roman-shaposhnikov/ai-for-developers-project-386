import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      if (typeof exceptionResponse === 'object' && exceptionResponse.code) {
        code = exceptionResponse.code;
        message = exceptionResponse.message;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.getCodeFromStatus(status);
      } else if (exceptionResponse.message) {
        message = Array.isArray(exceptionResponse.message) 
          ? exceptionResponse.message[0] 
          : exceptionResponse.message;
        code = this.getCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ErrorResponse = {
      error: {
        code,
        message,
      },
    };

    response.status(status).json(errorResponse);
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}
