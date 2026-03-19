# Admin Panel Frontend — Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Angular frontend for the admin panel — lazy-loaded standalone components with sidebar layout, 5 CRUD sections, modal forms, admin role guard.

---

## Overview

A separate dashboard-style admin panel accessible at `/admin`, built as a lazy-loaded Angular feature with its own routing. Uses ELA Beauty brand colors. Protected by an `adminGuard` (`CanMatchFn`) that verifies `role === 'admin'` against the backend. All 5 backend CRUDs are accessible via sidebar navigation.

All components are **standalone** (`standalone: true`) with their own `imports` arrays. No NgModules.

---

## Architecture

### File structure

```
frontend/src/app/pages/admin/
  admin.routes.ts
  layout/
    admin-layout.component.ts
    admin-layout.component.html
    admin-layout.component.scss
  dashboard/
    dashboard.component.ts
    dashboard.component.html
    dashboard.component.scss
  products/
    products.component.ts
    products.component.html
    products.component.scss
  hairstyles/
    hairstyles.component.ts
    hairstyles.component.html
    hairstyles.component.scss
  nail-designs/
    nail-designs.component.ts
    nail-designs.component.html
    nail-designs.component.scss
  services/
    services.component.ts
    services.component.html
    services.component.scss
  users/
    users.component.ts
    users.component.html
    users.component.scss
  shared/
    toast/
      toast.component.ts
      toast.component.html
      toast.component.scss
    toast.service.ts
  services-api/
    admin-products.service.ts
    admin-hairstyles.service.ts
    admin-nail-designs.service.ts
    admin-services.service.ts
    admin-users.service.ts
  guards/
    admin.guard.ts
```

### Route registration in app.routes.ts

The admin route must be inserted **before** the wildcard `{ path: '**', redirectTo: '' }`:

```ts
// Must come BEFORE the wildcard catch-all
{
  path: 'admin',
  canMatch: [adminGuard],
  loadChildren: () =>
    import('./pages/admin/admin.routes').then(m => m.adminRoutes),
  title: 'ELA Beauty - Admin'
},
{ path: '**', redirectTo: '', pathMatch: 'full' }
```

### admin.routes.ts

```ts
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsComponent } from './products/products.component';
import { HairstylesComponent } from './hairstyles/hairstyles.component';
import { NailDesignsComponent } from './nail-designs/nail-designs.component';
import { ServicesComponent } from './services/services.component';
import { UsersComponent } from './users/users.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: DashboardComponent, title: 'Admin - Dashboard' },
      { path: 'productos', component: ProductsComponent, title: 'Admin - Productos' },
      { path: 'peinados', component: HairstylesComponent, title: 'Admin - Peinados' },
      { path: 'unas', component: NailDesignsComponent, title: 'Admin - Diseños de Uñas' },
      { path: 'servicios', component: ServicesComponent, title: 'Admin - Servicios' },
      { path: 'usuarios', component: UsersComponent, title: 'Admin - Usuarios' },
    ]
  }
];
```

---

## Guard

**File:** `admin/guards/admin.guard.ts`
**Type:** `CanMatchFn`

```ts
import { inject } from '@angular/core';
import { Router, CanMatchFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getProfile().pipe(
    map((user: any) => {
      authService.currentUser.set(user);
      authService.isAuthenticated.set(true);
      if (user?.role === 'admin') return true;
      // Not admin — return false; wildcard route handles redirect to '/'
      return false;
    }),
    catchError(() => {
      authService.currentUser.set(null);
      authService.isAuthenticated.set(false);
      router.navigate(['/auth/login'], { queryParams: { returnUrl: '/admin' } });
      return of(false);
    }),
  );
};
```

- `role === 'admin'` → allow
- Authenticated but not admin → redirect to `/`
- Not authenticated (401/error) → redirect to `/auth/login?returnUrl=/admin`

---

## Layout

### AdminLayoutComponent required imports

```ts
imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule, ToastComponent]
```

### Sidebar (fixed left, 240px wide)

- ELA Beauty logo at top (`assets/logo/LOGOELAUNICO.jpg`)
- Navigation links with FontAwesome icons:
  - Dashboard — `fa-home` → `/admin`
  - Productos — `fa-box` → `/admin/productos`
  - Peinados — `fa-cut` → `/admin/peinados`
  - Diseños de Uñas — `fa-paint-brush` → `/admin/unas`
  - Servicios — `fa-spa` → `/admin/servicios`
  - Usuarios — `fa-users` → `/admin/usuarios`
- Active link: `#e6007e` left border (3px solid) + light pink tint background (`rgba(230,0,126,0.08)`)
- "← Volver al sitio" link pinned to bottom → `/`

### Content area (right of sidebar)

- Top bar: section title (h2) + admin name from `authService.currentUser()?.firstName`
- Main content: toolbar + table + pagination
- `<app-toast>` component placed at the bottom of `AdminLayoutComponent` template

---

## Toast System

**File:** `admin/shared/toast.service.ts`

```ts
interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const id = Date.now();
    // Replace any existing toast so only one is visible at a time
    this.toasts.set([{ id, message, type }]);
    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
```

**`ToastComponent`** (standalone): reads `toastService.toasts()` signal, renders the single active toast at bottom-right with CSS fade-out animation. Only one toast visible at a time — `show()` replaces any existing toast by calling `toasts.set([...])`. `AdminLayoutComponent` places `<app-toast>` once in its template.

---

## CRUD Sections (common pattern)

### Required imports per CRUD component

```ts
imports: [CommonModule, ReactiveFormsModule, FormsModule]
```

### Toolbar
- `+ Nuevo` button (pink, right-aligned) → opens create modal
- "Mostrar inactivos" checkbox — toggles `showInactive`, reloads page 1

### Table
- Columns vary per entity (see below)
- Estado badge: `Activo` (green) / `Inactivo` (red)
- Acciones: edit icon (`fa-edit`), deactivate toggle (`fa-toggle-on/off`), delete (`fa-trash` — only enabled when inactive)

### Pagination
Backend response shape: `{ data: T[], total: number, page: number, limit: number, totalPages: number }`

Component local state:
```ts
currentPage = signal(1);
limit = 20;
showInactive = signal(false);
```

Template:
- "← Anterior" button (disabled when `currentPage() === 1`)
- "Página X de Y" label
- "Siguiente →" button (disabled when `currentPage() === totalPages`)
- Change page → call `loadData()`

### Modal (create & edit)

- Each CRUD component has a local `showModal = signal(false)` and `editingItem = signal<T | null>(null)`
- `@HostListener('document:keydown.escape')` closes modal
- Backdrop `(click)` closes modal
- `FormGroup` with `Validators` matching required fields
- On success: `showModal.set(false)`, `loadData()`, `toastService.show('Guardado correctamente')`
- On 4xx error: display error message inside modal (not toast)
- On 5xx error: `toastService.show('Error del servidor', 'error')`

---

## Per-entity field details

### Productos — backend URL: `/api/admin/products`

HTTP methods: `GET` (list) · `POST` (create) · `PATCH /:id` (update) · `PATCH /:id/deactivate` · `PATCH /:id/restore` · `DELETE /:id`
ID type: `number`
Soft-delete field: `is_active`

Table columns: nombre, precio, categoría, stock, estado, acciones

Modal form (DTO field names sent to API):
| UI Label | DTO field | Validator |
|----------|-----------|-----------|
| Nombre | `name` | required |
| Descripción | `description` | required |
| Precio | `price` | required, min 0 |
| Categoría | `category` | required |
| Subcategoría | `subcategory` | — |
| Stock | `stock` | required, min 0 |
| Imagen URL | `image_url` | optional |
| Rating | `rating` | optional, 0–5 |
| Target Age | `target_age` | optional |

`review_count` — **not in form** (read-only, managed by system).

---

### Peinados — backend URL: `/api/admin/hairstyles`

HTTP methods: same pattern as products
ID type: `number`
Soft-delete field: `is_available`

Table columns: nombre, categoría, duración, precio, estado, acciones

Modal form:
| UI Label | DTO field | Validator |
|----------|-----------|-----------|
| Nombre | `name` | required |
| Descripción | `description` | required |
| Proceso | `process` | required |
| Duración | `duration` | optional |
| Precio | `price` | optional, min 0 |
| Categoría | `category` | optional |
| Imagen URL | `image_url` | optional |

---

### Diseños de Uñas — backend URL: `/api/admin/nail-designs`

HTTP methods: same pattern as products
ID type: `number`
Soft-delete field: `is_available`

Table columns: nombre, estilo, duración, precio, estado, acciones

Modal form:
| UI Label | DTO field | Validator |
|----------|-----------|-----------|
| Nombre | `name` | required |
| Descripción | `description` | required |
| Proceso | `process` | required |
| Duración | `duration` | optional |
| Precio | `price` | optional, min 0 |
| Estilo | `style` | optional |
| Imagen URL | `image_url` | optional |

---

### Servicios — backend URL: `/api/admin/services`

HTTP methods: `GET` · `POST` · `PATCH /:id` · `PATCH /:id/deactivate` · `PATCH /:id/restore` · `DELETE /:id`
ID type: **string (UUID)** — no `ParseIntPipe`
Soft-delete field: `isActive`

Table columns: nombre, categoría, precio, duración (min), estado, acciones

Modal form:
| UI Label | DTO field | Validator |
|----------|-----------|-----------|
| Nombre | `name` | required |
| Descripción | `description` | required |
| Precio | `price` | required, min 0 |
| Duración (min) | `duration` | required, min 1 |
| Categoría | `category` | required, select: facial/corporal/spa/masajes/manicure/pedicure |
| Imagen URL | `imageUrl` | optional (camelCase — different from other entities) |

---

### Usuarios — backend URL: `/api/admin/users`

HTTP methods: `GET` · `PATCH /:id/role` · `PATCH /:id/deactivate` · `PATCH /:id/restore` · `DELETE /:id`
ID type: `number`
Soft-delete field: `isActive`
**No create form.**

Table columns (API response uses camelCase — `firstName`, `lastName`):
`email` · `firstName` · `lastName` · `role` · `isActive` · `createdAt` · acciones

> ⚠️ Template must use `user.firstName` / `user.lastName`, NOT `user.nombre` / `user.apellido`

Actions:
- **Cambiar rol**: small modal with `<select>` for `user` / `admin` → `PATCH /api/admin/users/:id/role` body: `{ role }`
- **Desactivar / Restaurar**: toggle
- **Eliminar**: only shown if `!user.isActive && user.role !== 'admin'`

---

## Angular Services

Each service is `@Injectable({ providedIn: 'root' })`, injects `HttpClient`.

### AdminProductsService — `/api/admin/products`
```ts
findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<Product>>
create(dto: CreateProductDto): Observable<Product>
update(id: number, dto: UpdateProductDto): Observable<Product>
deactivate(id: number): Observable<Product>   // PATCH /:id/deactivate
restore(id: number): Observable<Product>      // PATCH /:id/restore
remove(id: number): Observable<{message:string}> // DELETE /:id
```

### AdminHairstylesService — `/api/admin/hairstyles`
Same signature as products (number IDs).

### AdminNailDesignsService — `/api/admin/nail-designs`
Same signature as products (number IDs).

### AdminServicesService — `/api/admin/services`
```ts
findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<Service>>
create(dto: CreateServiceDto): Observable<Service>
update(id: string, dto: UpdateServiceDto): Observable<Service>  // UUID string
deactivate(id: string): Observable<Service>   // PATCH /:id/deactivate
restore(id: string): Observable<Service>      // PATCH /:id/restore
remove(id: string): Observable<{message:string}> // DELETE /:id
```

### AdminUsersService — `/api/admin/users`
```ts
findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<User>>
updateRole(id: number, role: string): Observable<User>   // PATCH /:id/role
deactivate(id: number): Observable<{message:string}>     // PATCH /:id/deactivate
restore(id: number): Observable<{message:string}>        // PATCH /:id/restore
remove(id: number): Observable<{message:string}>         // DELETE /:id
```

### Shared interface

```ts
interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## Dashboard `/admin`

No new backend endpoint. Data strategy: use `forkJoin` to call `findAll(1, 1, true)` in parallel on all 5 services. Each stream has a `catchError(() => of({ total: 0 }))` so a failing endpoint shows `0` instead of breaking the dashboard.

`HttpClient` is provided globally via `provideHttpClient()` in `app.config.ts` — no per-component HttpClient import needed.

```ts
forkJoin({
  products:    this.productsService.findAll(1,1,true).pipe(catchError(() => of({total:0}))),
  hairstyles:  this.hairstylesService.findAll(1,1,true).pipe(catchError(() => of({total:0}))),
  nailDesigns: this.nailDesignsService.findAll(1,1,true).pipe(catchError(() => of({total:0}))),
  services:    this.servicesService.findAll(1,1,true).pipe(catchError(() => of({total:0}))),
  users:       this.usersService.findAll(1,1,true).pipe(catchError(() => of({total:0}))),
}).subscribe(counts => { this.counts = counts; });
```

`total` reflects **all records** (active + inactive) when `showInactive: true`, giving a true total count.

Summary cards: Total Productos · Total Peinados · Total Diseños · Total Servicios · Total Usuarios

Recent users table: call `AdminUsersService.findAll(1, 5, false)` → display first 5 active users.

---

## Visual Design

| Element | Value |
|---------|-------|
| Sidebar background | `#111111` |
| Sidebar text | `#cccccc` |
| Active link accent | `#e6007e` |
| Content background | `#f5f5f5` |
| Cards/tables background | `#ffffff` |
| Primary button | `#e6007e` |
| Danger button | `#dc3545` |
| Font heading | Montserrat |
| Font body | Open Sans |
| Shadows | `var(--shadow-sm)`, `var(--shadow-md)` |

---

## Error handling

- HTTP 401 → guard `catchError` → redirect `/auth/login`
- HTTP 403 → `toastService.show('No tienes permisos', 'error')`
- HTTP 4xx → show inline error inside modal
- HTTP 5xx → `toastService.show('Error del servidor, intenta de nuevo', 'error')`

---

## Out of scope

- Analytics/charts on dashboard
- Image file upload (URL input only)
- Bulk operations
- Export CSV
- Search/filter inputs (future)
