import { Routes } from '@angular/router';
import { BodyComponent } from './components/body/body.component';
import { SearchResultsComponent } from './pages/search-results/search-results.component';

export const routes: Routes = [
  { path: '', component: BodyComponent, title: 'ELA Beauty - Inicio' },
  { path: 'labiales', component: BodyComponent, title: 'ELA Beauty - Labiales' },
  { path: 'rostro', component: BodyComponent, title: 'ELA Beauty - Rostro' },
  { path: 'ojos', component: BodyComponent, title: 'ELA Beauty - Ojos' },
  { path: 'unas', component: BodyComponent, title: 'ELA Beauty - Uñas' },
  { path: 'ofertas', component: BodyComponent, title: 'ELA Beauty - Ofertas' },
  { path: 'nuevo', component: BodyComponent, title: 'ELA Beauty - Nuevo' },
  { path: 'busqueda', component: SearchResultsComponent, title: 'ELA Beauty - Resultados de búsqueda' },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
