import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(40px) scale(0.92)' }),
        animate('300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'translateX(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('220ms cubic-bezier(0.55, 0, 1, 0.45)',
          style({ opacity: 0, transform: 'translateX(50px) scale(0.9)' }))
      ])
    ]),
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('160ms ease', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalBoxAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.88) translateY(20px)' }),
        animate('300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ])
  ],
  template: `
    <!-- ── TOAST STACK ── -->
    <div class="toast-stack" aria-live="polite">
      @for (t of notif.toasts(); track t.id) {
        <div class="toast toast--{{ t.type }}"
             role="alert"
             [@toastAnim]>
          <span class="toast-icon" aria-hidden="true">
            @if (t.type === 'success') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            }
            @if (t.type === 'error') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
            @if (t.type === 'warning') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            }
            @if (t.type === 'info') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" (click)="notif.dismissToast(t.id)" aria-label="Cerrar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <!-- progress bar -->
          <div class="toast-progress" [style.animation-duration]="(t.duration || 4000) + 'ms'"></div>
        </div>
      }
    </div>

    <!-- ── CONFIRM MODAL ── -->
    @if (notif.confirm$(); as state) {
      <div class="modal-overlay"
           [@modalAnim]
           (click)="notif.resolveConfirm(false)"
           role="dialog"
           aria-modal="true">
        <div class="modal-box" [@modalBoxAnim] (click)="$event.stopPropagation()">
          <div class="modal-icon" [class.modal-icon--danger]="state.danger">
            @if (state.danger) {
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            } @else {
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </div>
          <h3 class="modal-title">{{ state.title }}</h3>
          <p class="modal-msg">{{ state.message }}</p>
          <div class="modal-actions">
            <button class="modal-btn modal-btn--cancel" (click)="notif.resolveConfirm(false)">
              {{ state.cancelText }}
            </button>
            <button class="modal-btn"
                    [class.modal-btn--danger]="state.danger"
                    [class.modal-btn--confirm]="!state.danger"
                    (click)="notif.resolveConfirm(true)">
              {{ state.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── TOASTS ── */
    .toast-stack {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 400px;
    }

    .toast {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 14px 16px;
      border-radius: 14px;
      min-width: 280px;
      max-width: 400px;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 10px 28px rgba(0,0,0,0.22);
      pointer-events: all;
      font-family: var(--font-body, 'Open Sans', sans-serif);
      overflow: hidden;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .toast--success {
      background: rgba(21, 128, 61, 0.92);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      .toast-progress { background: rgba(255,255,255,0.45); }
    }
    .toast--error {
      background: rgba(220, 38, 38, 0.92);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      .toast-progress { background: rgba(255,255,255,0.45); }
    }
    .toast--warning {
      background: rgba(217, 119, 6, 0.92);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      .toast-progress { background: rgba(255,255,255,0.45); }
    }
    .toast--info {
      background: rgba(29, 78, 216, 0.92);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      .toast-progress { background: rgba(255,255,255,0.45); }
    }

    .toast-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      opacity: 0.95;
    }

    .toast-msg { flex: 1; line-height: 1.45; }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.7);
      display: flex;
      padding: 3px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      flex-shrink: 0;
      margin-left: 4px;
      &:hover {
        color: #fff;
        background: rgba(255,255,255,0.15);
      }
    }

    /* Progress bar */
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      border-radius: 0 0 14px 14px;
      animation: toastProgress linear forwards;
    }

    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    /* ── CONFIRM MODAL ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.58);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-box {
      background: var(--surface-1, #fff);
      border-radius: 22px;
      padding: 2.5rem 2rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.28);
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .modal-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(29, 78, 216, 0.1);
      color: #1d4ed8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.2rem;
    }

    .modal-icon--danger {
      background: rgba(220, 38, 38, 0.1);
      color: #dc2626;
    }

    .modal-title {
      font-family: var(--font-heading, 'Montserrat', sans-serif);
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary, #111);
      margin-bottom: 0.6rem;
    }

    .modal-msg {
      font-size: 0.9rem;
      color: var(--text-secondary, #666);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .modal-btn {
      padding: 10px 24px;
      border-radius: 25px;
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .modal-btn--cancel {
      background: var(--gray-100, #f5f5f5);
      color: var(--text-secondary, #666);
      border: 1px solid var(--gray-300, #e0e0e0);
      &:hover { background: var(--gray-200, #eee); }
    }

    .modal-btn--confirm {
      background: var(--primary-color, #e6007e);
      color: #fff;
      &:hover { filter: brightness(1.1); transform: translateY(-1px); }
    }

    .modal-btn--danger {
      background: #dc2626;
      color: #fff;
      &:hover { background: #b91c1c; transform: translateY(-1px); }
    }

    @media (max-width: 480px) {
      .toast-stack {
        bottom: 1rem;
        right: 1rem;
        left: 1rem;
        max-width: 100%;
      }
      .toast { min-width: unset; width: 100%; }
    }
  `]
})
export class NotificationsComponent {
  readonly notif = inject(NotificationService);
}
