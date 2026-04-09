import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NotificationsComponent } from './components/ui/notifications.component';
import { NavProgressComponent } from './components/ui/nav-progress.component';
import { BackToTopComponent } from './components/ui/back-to-top.component';
import { filter } from 'rxjs/operators';
import { routeAnimations } from './animations/route.animations';

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

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.isAdminRoute.set(e.url.startsWith('/admin'));
    });
  }

  getRouteState(outlet: RouterOutlet) {
    return outlet.isActivated ? outlet.activatedRoute.snapshot.url.join('/') : '';
  }
}