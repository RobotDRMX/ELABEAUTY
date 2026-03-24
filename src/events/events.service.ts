import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface AppEvent {
  type: string;
  data?: any;
}

@Injectable()
export class EventsService {
  private subject = new Subject<AppEvent>();

  emit(type: string, data?: any) {
    this.subject.next({ type, data: data ?? {} });
  }

  getStream(): Observable<AppEvent> {
    return this.subject.asObservable();
  }
}
