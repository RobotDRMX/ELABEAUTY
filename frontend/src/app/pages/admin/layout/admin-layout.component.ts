import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService, Theme, THEME_OPTIONS } from '../../../services/theme.service';
import { ToastComponent } from '../shared/toast/toast.component';
import { LucideIcons } from '../../../icons.provider';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet, ToastComponent, LucideIcons],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  get adminName(): string {
    return this.authService.currentUser()?.firstName ?? 'Admin';
  }

  logout() {
    this.authService.logout();
  }

  readonly modeThemes = THEME_OPTIONS.filter(t => t.group === 'mode');
  readonly a11yThemes = THEME_OPTIONS.filter(t => t.group === 'colorblind');

  get isA11yTheme(): boolean {
    return this.a11yThemes.some(t => t.value === this.themeService.theme());
  }

  protected readonly navItems: { label: string; icon: string; path: string }[] = [
    { label: 'Dashboard',        icon: 'home',        path: '/admin' },
    { label: 'Productos',        icon: 'box',         path: '/admin/productos' },
    { label: 'Peinados',         icon: 'scissors',    path: '/admin/peinados' },
    { label: 'Diseños de Uñas',  icon: 'paintbrush',  path: '/admin/unas' },
    { label: 'Servicios',        icon: 'sparkle',     path: '/admin/servicios' },
    { label: 'Ofertas',          icon: 'tag',         path: '/admin/ofertas' },
    { label: 'Usuarios',         icon: 'users',       path: '/admin/usuarios' },
  ];
}
