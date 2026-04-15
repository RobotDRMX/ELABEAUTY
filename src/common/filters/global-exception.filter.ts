import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const isDev = process.env['NODE_ENV'] === 'development';

    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as any).message;
      // En producción, los errores de validación (400) no revelan campos internos
      if (!isDev && status === HttpStatus.BAD_REQUEST && Array.isArray(msg)) {
        message = 'Datos de entrada inválidos';
      } else {
        message = Array.isArray(msg) ? msg.join(', ') : msg;
      }
    } else if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'Error interno del servidor';
    } else {
      message = 'Error desconocido';
    }

    // Siempre loguear errores de servidor (5xx). En dev loguear todo.
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (process.env['NODE_ENV'] !== 'production') {
      this.logger.warn(`[${request.method}] ${request.url} → ${status}: ${message}`);
    }

    // Asegurar que la respuesta sea JSON incluso si el header original no lo es
    response.setHeader('Content-Type', 'application/json');
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
