import { Routes } from '@angular/router';
import { BodyComponent } from './components/body/body.component';
import { SearchResultsComponent } from './pages/search-results/search-results.component';
import { TermsOfUseComponent } from './pages/terms-of-use/terms-of-use.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './pages/admin/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: BodyComponent, title: 'page.title.home' },
  { path: 'labiales', component: BodyComponent, title: 'page.title.home' },
  { path: 'rostro', component: BodyComponent, title: 'page.title.home' },
  { path: 'ojos', component: BodyComponent, title: 'page.title.home' },
  { path: 'unas', component: BodyComponent, title: 'page.title.home' },
  { path: 'ofertas', component: BodyComponent, title: 'page.title.home' },
  { path: 'nuevo', component: BodyComponent, title: 'page.title.home' },
  { path: 'busqueda', component: SearchResultsComponent, title: 'page.title.search' },
  { path: 'terminos-de-uso', component: TermsOfUseComponent, title: 'page.title.terms' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
        title: 'page.title.login'
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'page.title.register'
      },
      {
        path: 'verificar-correo',
        loadComponent: () => import('./pages/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
        title: 'page.title.login'
      },
      {
        path: 'olvide-contrasena',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'page.title.login'
      },
      {
        path: 'recuperar-contrasena',
        loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'page.title.login'
      },
      {
        path: 'reenviar-verificacion',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'page.title.login'
      },
    ]
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'page.title.profile'
  },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
    canActivate: [authGuard],
    title: 'page.title.cart'
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./pages/favorites/favorites.component').then(m => m.FavoritesComponent),
    canActivate: [authGuard],
    title: 'page.title.favorites'
  },
  {
    path: 'peinados',
    loadComponent: () => import('./pages/hairstyles/hairstyles.component').then(m => m.HairstylesComponent),
    title: 'page.title.hairstyles'
  },
  {
    path: 'disenos-unas',
    loadComponent: () => import('./pages/nail-designs/nail-designs.component').then(m => m.NailDesignsComponent),
    title: 'page.title.nail_designs'
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.adminRoutes),
    title: 'page.title.admin',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'page.title.404'
  }
];
