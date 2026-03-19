import { Routes } from '@angular/router';
import { BodyComponent } from './components/body/body.component';
import { SearchResultsComponent } from './pages/search-results/search-results.component';
import { TermsOfUseComponent } from './pages/terms-of-use/terms-of-use.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './pages/admin/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: BodyComponent, title: 'ELA Beauty - Inicio' },
  { path: 'labiales', component: BodyComponent, title: 'ELA Beauty - Labiales' },
  { path: 'rostro', component: BodyComponent, title: 'ELA Beauty - Rostro' },
  { path: 'ojos', component: BodyComponent, title: 'ELA Beauty - Ojos' },
  { path: 'unas', component: BodyComponent, title: 'ELA Beauty - Uñas' },
  { path: 'ofertas', component: BodyComponent, title: 'ELA Beauty - Ofertas' },
  { path: 'nuevo', component: BodyComponent, title: 'ELA Beauty - Nuevo' },
  { path: 'busqueda', component: SearchResultsComponent, title: 'ELA Beauty - Catálogo' },
  { path: 'terminos-de-uso', component: TermsOfUseComponent, title: 'ELA Beauty - Términos de Uso' },
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent), title: 'ELA Beauty - Iniciar Sesión' },
      { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent), title: 'ELA Beauty - Registro' }
    ]
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'ELA Beauty - Mi Perfil'
  },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
    canActivate: [authGuard],
    title: 'ELA Beauty - Bolsa de Compras'
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./pages/favorites/favorites.component').then(m => m.FavoritesComponent),
    canActivate: [authGuard],
    title: 'ELA Beauty - Mis Favoritos ⭐'
  },
  {
    path: 'peinados',
    loadComponent: () => import('./pages/hairstyles/hairstyles.component').then(m => m.HairstylesComponent),
    title: 'ELA Beauty - Peinados & Cortes'
  },
  {
    path: 'disenos-unas',
    loadComponent: () => import('./pages/nail-designs/nail-designs.component').then(m => m.NailDesignsComponent),
    title: 'ELA Beauty - Diseños de Uñas'
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.adminRoutes),
    title: 'ELA Beauty - Admin',
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
