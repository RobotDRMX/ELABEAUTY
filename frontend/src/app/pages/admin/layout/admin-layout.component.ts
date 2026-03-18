import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastComponent } from '../shared/toast/toast.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  authService = inject(AuthService);

  get adminName(): string {
    return this.authService.currentUser()?.firstName ?? 'Admin';
  }

  navItems = [
    { label: 'Dashboard',        icon: 'fa-home',        path: '/admin' },
    { label: 'Productos',        icon: 'fa-box',         path: '/admin/productos' },
    { label: 'Peinados',         icon: 'fa-cut',         path: '/admin/peinados' },
    { label: 'Diseños de Uñas',  icon: 'fa-paint-brush', path: '/admin/unas' },
    { label: 'Servicios',        icon: 'fa-spa',         path: '/admin/servicios' },
    { label: 'Usuarios',         icon: 'fa-users',       path: '/admin/usuarios' },
  ];
}
