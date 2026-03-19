import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Admin - Dashboard' },
      { path: 'productos', loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent), title: 'Admin - Productos' },
      { path: 'peinados', loadComponent: () => import('./hairstyles/hairstyles.component').then(m => m.HairstylesComponent), title: 'Admin - Peinados' },
      { path: 'unas', loadComponent: () => import('./nail-designs/nail-designs.component').then(m => m.NailDesignsComponent), title: 'Admin - Diseños de Uñas' },
      { path: 'servicios', loadComponent: () => import('./services/services.component').then(m => m.ServicesComponent), title: 'Admin - Servicios' },
      { path: 'usuarios', loadComponent: () => import('./users/users.component').then(m => m.UsersComponent), title: 'Admin - Usuarios' },
    ]
  }
];
