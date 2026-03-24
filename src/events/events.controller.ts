import { Controller, Sse, MessageEvent, Header } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { EventsService } from './events.service';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('stream')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Accel-Buffering', 'no')
  stream(): Observable<MessageEvent> {
    return this.eventsService.getStream().pipe(
      map(event => ({
        type: event.type,
        data: JSON.stringify(event.data ?? {}),
      })),
    );
  }
}
