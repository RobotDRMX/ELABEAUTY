import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NotificationsComponent } from './components/ui/notifications.component';
import { NavProgressComponent } from './components/ui/nav-progress.component';
import { BackToTopComponent } from './components/ui/back-to-top.component';
import { filter } from 'rxjs/operators';
import { routeAnimations } from './animations/route.animations';
import { NotificationService } from './services/notification.service';
import { I18nService } from './services/i18n.service';
import { AuthService } from './services/auth.service';
import { InactivityService } from './services/inactivity.service';
import { ThemeService } from './services/theme.service'; // Import ThemeService

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    NotificationsComponent,
    NavProgressComponent,
    BackToTopComponent
  ],
  animations: [routeAnimations],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ELA Beauty';
  isAdminRoute = signal(false);

  private auth = inject(AuthService);
  // Inject ThemeService here
  private themeService = inject(ThemeService); // Inject ThemeService

  constructor(
    private router: Router,
    private notif: NotificationService,
    private i18n: I18nService
  ) {
    const inactivity = inject(InactivityService);

    effect(() => {
      const authenticated = this.auth.isAuthenticated();
      if (authenticated) {
        const isAdmin = this.router.url.startsWith('/admin');
        inactivity.start(isAdmin);
      } else {
        inactivity.stop();
      }
    });

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.isAdminRoute.set(e.url.startsWith('/admin'));
      const state = this.router.lastSuccessfulNavigation?.extras?.state;
      if (state?.['unauthorized']) {
        this.notif.toast(this.i18n.t('auth.unauthorized'), 'error');
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'inactivity') {
        this.notif.toast(this.i18n.t('inactivity.logged_out'), 'info');
      }
    });
  }

  getRouteState(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.url.join('/') : '';
  }
}