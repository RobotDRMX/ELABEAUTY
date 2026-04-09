import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  private warningTimer?: ReturnType<typeof setTimeout>;
  private isAdmin = false;
  private readonly EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  private boundReset = () => this.resetTimer();

  start(isAdminRoute: boolean) {
    this.isAdmin = isAdminRoute;
    this.EVENTS.forEach(e => document.addEventListener(e, this.boundReset, { passive: true }));
    this.scheduleTimers();
  }

  stop() {
    this.EVENTS.forEach(e => document.removeEventListener(e, this.boundReset));
    clearTimeout(this.warningTimer);
  }

  resetTimer() {
    clearTimeout(this.warningTimer);
    this.scheduleTimers();
  }

  private scheduleTimers() {
    const totalMs = this.isAdmin ? 15 * 60 * 1000 : 30 * 60 * 1000;
    const warnMs  = totalMs - 5 * 60 * 1000;
    this.warningTimer = setTimeout(() => this.showWarning(), warnMs);
  }

  private async showWarning() {
    const confirmed = await this.notif.confirm(
      this.i18n.t('inactivity.warning_title'),
      this.i18n.t('inactivity.warning_msg'),
      {
        confirmText: this.i18n.t('inactivity.keep_session'),
        cancelText: this.i18n.t('header.logout'),
        danger: false
      }
    );

    if (confirmed) {
      this.resetTimer();
    } else {
      this.performLogout();
    }
  }

  private performLogout() {
    this.stop();
    this.auth.logout();
    this.router.navigate(['/auth/login'], { queryParams: { reason: 'inactivity' } });
  }

  ngOnDestroy() { this.stop(); }
}
