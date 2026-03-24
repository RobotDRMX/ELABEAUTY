import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export interface ConfirmState {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts   = signal<ToastItem[]>([]);
  readonly confirm$ = signal<ConfirmState | null>(null);

  /** Muestra un toast auto-dismiss */
  toast(message: string, type: ToastType = 'info', duration = 4000) {
    const id = Date.now() + Math.random();
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismissToast(id), duration);
  }

  dismissToast(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  /** Muestra un modal de confirmación y devuelve Promise<boolean> */
  confirm(
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string; danger?: boolean }
  ): Promise<boolean> {
    return new Promise(resolve => {
      this.confirm$.set({
        title,
        message,
        confirmText: options?.confirmText ?? 'Confirmar',
        cancelText:  options?.cancelText  ?? 'Cancelar',
        danger:      options?.danger      ?? false,
        resolve,
      });
    });
  }

  resolveConfirm(value: boolean) {
    this.confirm$()?.resolve(value);
    this.confirm$.set(null);
  }
}
