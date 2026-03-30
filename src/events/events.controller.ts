import { Controller, Sse, MessageEvent, Header, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, map, finalize } from 'rxjs';
import { Response } from 'express';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/auth.module';

@ApiTags('Eventos SSE')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Stream de eventos en tiempo real (SSE)' })
  @Sse('stream')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Accel-Buffering', 'no')
  stream(@Res() res: Response): Observable<MessageEvent> {
    this.eventsService.acquireConnection();
    res.on('close', () => this.eventsService.releaseConnection());

    return this.eventsService.getStream().pipe(
      map(event => ({
        type: event.type,
        data: JSON.stringify(event.data ?? {}),
      })),
      finalize(() => this.eventsService.releaseConnection()),
    );
  }
}
