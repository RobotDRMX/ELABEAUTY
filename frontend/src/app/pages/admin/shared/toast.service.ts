import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const id = Date.now();
    // Replace any existing toast — only one visible at a time
    this._toasts.set([{ id, message, type }]);
    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: number) {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
