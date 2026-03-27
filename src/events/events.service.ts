import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface AppEvent {
  type: string;
  data?: any;
}

@Injectable()
export class EventsService {
  private subject = new Subject<AppEvent>();
  private _connections = 0;
  private readonly MAX_CONNECTIONS = 100;

  get connections(): number {
    return this._connections;
  }

  acquireConnection(): void {
    if (this._connections >= this.MAX_CONNECTIONS) {
      throw new ServiceUnavailableException('Demasiadas conexiones SSE');
    }
    this._connections++;
  }

  releaseConnection(): void {
    this._connections = Math.max(0, this._connections - 1);
  }

  emit(type: string, _data?: any) {
    // Only emit minimal, non-sensitive event data
    this.subject.next({ type, data: { timestamp: new Date().toISOString() } });
  }

  getStream(): Observable<AppEvent> {
    return this.subject.asObservable();
  }
}
