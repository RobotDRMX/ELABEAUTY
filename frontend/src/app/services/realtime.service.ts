import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ServerEvent {
  type: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private readonly url = environment.apiBaseUrl + '/events/stream';
  private eventSource: EventSource | null = null;
  private events$ = new Subject<ServerEvent>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private failCount = 0;

  constructor(private zone: NgZone) {
    this.connect();
  }

  private connect() {
    if (this.destroyed) return;

    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      // Don't reconnect if the error is QUIC/HTTP3 incompatibility (production)
      // or if the stream returned a non-2xx status
      if (!this.destroyed && !this.failCount) {
        this.failCount = (this.failCount ?? 0) + 1;
        this.reconnectTimer = setTimeout(() => this.connect(), 30000);
      }
    };

    // Listen to all named events emitted by the backend
    const eventTypes = ['products:updated', 'hairstyles:updated', 'nail-designs:updated', 'services:updated'];
    for (const type of eventTypes) {
      this.eventSource.addEventListener(type, (e: Event) => {
        const msg = e as MessageEvent;
        let data: any = {};
        try { data = JSON.parse(msg.data); } catch { /* ignore */ }
        this.zone.run(() => this.events$.next({ type, data }));
      });
    }
  }

  on(eventType: string): Observable<any> {
    return this.events$.pipe(
      filter(e => e.type === eventType),
      map(e => e.data),
    );
  }

  ngOnDestroy() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.eventSource?.close();
    this.events$.complete();
  }
}
