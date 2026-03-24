# Admin Panel Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Angular admin panel at `/admin` with sidebar layout, admin guard, and CRUD tables + modals for Products, Hairstyles, Nail Designs, Services, and Users.

**Architecture:** Lazy-loaded Angular feature at `frontend/src/app/pages/admin/` using standalone components and its own `admin.routes.ts`. Guard uses `CanMatchFn` to verify `role === 'admin'`. Five API services call the existing NestJS backend at `/api/admin/*`. Modals are inline per CRUD component (no shared modal component).

**Tech Stack:** Angular 17 standalone components, ReactiveFormsModule, HttpClient (already provided globally), signals for local state, FontAwesome icons (already loaded), ELA Beauty CSS variables.

---

## File Map

### New files
```
frontend/src/app/pages/admin/
  admin.routes.ts
  guards/
    admin.guard.ts
  shared/
    toast.service.ts
    toast/
      toast.component.ts
      toast.component.html
      toast.component.scss
  services-api/
    admin-products.service.ts
    admin-hairstyles.service.ts
    admin-nail-designs.service.ts
    admin-services.service.ts
    admin-users.service.ts
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
```

### Modified files
```
frontend/src/app/app.routes.ts   ← add admin lazy route before wildcard
```

---

## Chunk 1: Foundation (Guard + Toast + Routes)

### Task 1: Toast Service + Toast Component

**Files:**
- Create: `frontend/src/app/pages/admin/shared/toast.service.ts`
- Create: `frontend/src/app/pages/admin/shared/toast/toast.component.ts`
- Create: `frontend/src/app/pages/admin/shared/toast/toast.component.html`
- Create: `frontend/src/app/pages/admin/shared/toast/toast.component.scss`

- [ ] **Step 1: Create ToastService**

```typescript
// frontend/src/app/pages/admin/shared/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const id = Date.now();
    // Replace any existing toast — only one visible at a time
    this.toasts.set([{ id, message, type }]);
    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
```

- [ ] **Step 2: Create ToastComponent**

```typescript
// frontend/src/app/pages/admin/shared/toast/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
```

```html
<!-- frontend/src/app/pages/admin/shared/toast/toast.component.html -->
<div class="toast-container">
  @for (toast of toastService.toasts(); track toast.id) {
    <div class="toast" [class]="'toast--' + toast.type">
      <span class="toast-message">{{ toast.message }}</span>
      <button class="toast-close" (click)="toastService.dismiss(toast.id)">
        <i class="fas fa-times"></i>
      </button>
    </div>
  }
</div>
```

```scss
// frontend/src/app/pages/admin/shared/toast/toast.component.scss
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  min-width: 280px;
  max-width: 400px;
  font-family: var(--font-body);
  font-size: 14px;
  box-shadow: var(--shadow-md);
  animation: slideIn 0.3s ease;

  &--success { background: #1a7a4a; color: #fff; }
  &--error   { background: #dc3545; color: #fff; }
  &--warning { background: #e6a817; color: #fff; }
}

.toast-message { flex: 1; }

.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.8;
  padding: 0;
  &:hover { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/shared/
git commit -m "feat(admin): add ToastService and ToastComponent"
```

---

### Task 2: Admin Guard + admin.routes.ts + register in app.routes.ts

**Files:**
- Create: `frontend/src/app/pages/admin/guards/admin.guard.ts`
- Create: `frontend/src/app/pages/admin/admin.routes.ts`
- Modify: `frontend/src/app/app.routes.ts`

- [ ] **Step 1: Create admin.guard.ts**

```typescript
// frontend/src/app/pages/admin/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router, CanMatchFn } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
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

- [ ] **Step 2: Create admin.routes.ts with placeholder components**

Create stub components first so the routes file compiles. Real components are built in later tasks.

```typescript
// frontend/src/app/pages/admin/admin.routes.ts
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
```

- [ ] **Step 3: Register admin route in app.routes.ts**

In `frontend/src/app/app.routes.ts`, add the admin route **before** the `{ path: '**', redirectTo: '', pathMatch: 'full' }` line. Also import `adminGuard`.

Add import at the top:
```typescript
import { adminGuard } from './pages/admin/guards/admin.guard';
```

Add route before the wildcard:
```typescript
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.adminRoutes),
    title: 'ELA Beauty - Admin',
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: errors only for missing component files (to be created in later tasks). If there are errors in `app.routes.ts` or `admin.guard.ts` itself, fix them.

- [ ] **Step 5: Commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/guards/ frontend/src/app/pages/admin/admin.routes.ts frontend/src/app/app.routes.ts
git commit -m "feat(admin): add adminGuard, admin.routes.ts, register lazy route in app"
```

---

## Chunk 2: API Services

### Task 3: Five Admin API Services

**Files:**
- Create: `frontend/src/app/pages/admin/services-api/admin-products.service.ts`
- Create: `frontend/src/app/pages/admin/services-api/admin-hairstyles.service.ts`
- Create: `frontend/src/app/pages/admin/services-api/admin-nail-designs.service.ts`
- Create: `frontend/src/app/pages/admin/services-api/admin-services.service.ts`
- Create: `frontend/src/app/pages/admin/services-api/admin-users.service.ts`

- [ ] **Step 1: Create shared PagedResult interface and AdminProductsService**

```typescript
// frontend/src/app/pages/admin/services-api/admin-products.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API = 'http://localhost:3000/api/admin/products';

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private http = inject(HttpClient);

  findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('showInactive', showInactive);
    return this.http.get<PagedResult<any>>(API, { params });
  }

  create(dto: any): Observable<any> {
    return this.http.post<any>(API, dto);
  }

  update(id: number, dto: any): Observable<any> {
    return this.http.patch<any>(`${API}/${id}`, dto);
  }

  deactivate(id: number): Observable<any> {
    return this.http.patch<any>(`${API}/${id}/deactivate`, {});
  }

  restore(id: number): Observable<any> {
    return this.http.patch<any>(`${API}/${id}/restore`, {});
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/${id}`);
  }
}
```

- [ ] **Step 2: Create AdminHairstylesService**

```typescript
// frontend/src/app/pages/admin/services-api/admin-hairstyles.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './admin-products.service';

const API = 'http://localhost:3000/api/admin/hairstyles';

@Injectable({ providedIn: 'root' })
export class AdminHairstylesService {
  private http = inject(HttpClient);

  findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('page', page).set('limit', limit).set('showInactive', showInactive);
    return this.http.get<PagedResult<any>>(API, { params });
  }

  create(dto: any): Observable<any> { return this.http.post<any>(API, dto); }
  update(id: number, dto: any): Observable<any> { return this.http.patch<any>(`${API}/${id}`, dto); }
  deactivate(id: number): Observable<any> { return this.http.patch<any>(`${API}/${id}/deactivate`, {}); }
  restore(id: number): Observable<any> { return this.http.patch<any>(`${API}/${id}/restore`, {}); }
  remove(id: number): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${API}/${id}`); }
}
```

- [ ] **Step 3: Create AdminNailDesignsService**

```typescript
// frontend/src/app/pages/admin/services-api/admin-nail-designs.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './admin-products.service';

const API = 'http://localhost:3000/api/admin/nail-designs';

@Injectable({ providedIn: 'root' })
export class AdminNailDesignsService {
  private http = inject(HttpClient);

  findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('page', page).set('limit', limit).set('showInactive', showInactive);
    return this.http.get<PagedResult<any>>(API, { params });
  }

  create(dto: any): Observable<any> { return this.http.post<any>(API, dto); }
  update(id: number, dto: any): Observable<any> { return this.http.patch<any>(`${API}/${id}`, dto); }
  deactivate(id: number): Observable<any> { return this.http.patch<any>(`${API}/${id}/deactivate`, {}); }
  restore(id: number): Observable<any> { return this.http.patch<any>(`${API}/${id}/restore`, {}); }
  remove(id: number): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${API}/${id}`); }
}
```

- [ ] **Step 4: Create AdminServicesService (UUID string IDs)**

```typescript
// frontend/src/app/pages/admin/services-api/admin-services.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './admin-products.service';

const API = 'http://localhost:3000/api/admin/services';

@Injectable({ providedIn: 'root' })
export class AdminServicesService {
  private http = inject(HttpClient);

  findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('page', page).set('limit', limit).set('showInactive', showInactive);
    return this.http.get<PagedResult<any>>(API, { params });
  }

  create(dto: any): Observable<any> { return this.http.post<any>(API, dto); }
  update(id: string, dto: any): Observable<any> { return this.http.patch<any>(`${API}/${id}`, dto); }
  deactivate(id: string): Observable<any> { return this.http.patch<any>(`${API}/${id}/deactivate`, {}); }
  restore(id: string): Observable<any> { return this.http.patch<any>(`${API}/${id}/restore`, {}); }
  remove(id: string): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${API}/${id}`); }
}
```

- [ ] **Step 5: Create AdminUsersService (no create)**

```typescript
// frontend/src/app/pages/admin/services-api/admin-users.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './admin-products.service';

const API = 'http://localhost:3000/api/admin/users';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);

  findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('page', page).set('limit', limit).set('showInactive', showInactive);
    return this.http.get<PagedResult<any>>(API, { params });
  }

  updateRole(id: number, role: string): Observable<any> {
    return this.http.patch<any>(`${API}/${id}/role`, { role });
  }

  deactivate(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${API}/${id}/deactivate`, {});
  }

  restore(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${API}/${id}/restore`, {});
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/${id}`);
  }
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

- [ ] **Step 7: Commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/services-api/
git commit -m "feat(admin): add 5 admin API services"
```

---

## Chunk 3: Layout + Dashboard

### Task 4: AdminLayoutComponent (sidebar shell)

**Files:**
- Create: `frontend/src/app/pages/admin/layout/admin-layout.component.ts`
- Create: `frontend/src/app/pages/admin/layout/admin-layout.component.html`
- Create: `frontend/src/app/pages/admin/layout/admin-layout.component.scss`

- [ ] **Step 1: Create admin-layout.component.ts**

```typescript
// frontend/src/app/pages/admin/layout/admin-layout.component.ts
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
```

- [ ] **Step 2: Create admin-layout.component.html**

```html
<!-- frontend/src/app/pages/admin/layout/admin-layout.component.html -->
<div class="admin-shell">
  <!-- SIDEBAR -->
  <aside class="admin-sidebar">
    <div class="sidebar-logo">
      <img src="assets/logo/LOGOELAUNICO.jpg" alt="ELA Beauty" />
    </div>

    <nav class="sidebar-nav">
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
          class="sidebar-link"
        >
          <i class="fas {{ item.icon }}"></i>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>

    <div class="sidebar-footer">
      <a routerLink="/" class="sidebar-link sidebar-link--back">
        <i class="fas fa-arrow-left"></i>
        <span>Volver al sitio</span>
      </a>
    </div>
  </aside>

  <!-- CONTENT AREA -->
  <div class="admin-content">
    <header class="admin-topbar">
      <span class="admin-topbar-title">Panel de Administración</span>
      <span class="admin-topbar-user">
        <i class="fas fa-user-circle"></i> {{ adminName }}
      </span>
    </header>

    <main class="admin-main">
      <router-outlet></router-outlet>
    </main>
  </div>

  <app-toast></app-toast>
</div>
```

- [ ] **Step 3: Create admin-layout.component.scss**

```scss
// frontend/src/app/pages/admin/layout/admin-layout.component.scss
.admin-shell {
  display: flex;
  min-height: 100vh;
  font-family: var(--font-body);
}

/* ── SIDEBAR ── */
.admin-sidebar {
  width: 240px;
  min-height: 100vh;
  background: #111111;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-logo {
  padding: 24px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  img {
    width: 100px;
    border-radius: 50%;
    display: block;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 12px 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #cccccc;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
  border-left: 3px solid transparent;

  i { width: 16px; text-align: center; }

  &:hover {
    background: rgba(255,255,255,0.06);
    color: #ffffff;
  }

  &.active {
    background: rgba(230, 0, 126, 0.08);
    border-left-color: #e6007e;
    color: #e6007e;
  }

  &--back {
    color: #888;
    &:hover { color: #ccc; }
  }
}

.sidebar-footer {
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.08);
}

/* ── CONTENT ── */
.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  min-width: 0;
}

.admin-topbar {
  background: #ffffff;
  padding: 16px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--gray-300);
  box-shadow: var(--shadow-sm);

  &-title {
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 16px;
    color: #111;
  }

  &-user {
    font-size: 14px;
    color: var(--text-secondary);
    i { color: #e6007e; margin-right: 6px; }
  }
}

.admin-main {
  flex: 1;
  padding: 28px;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

- [ ] **Step 5: Commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/layout/
git commit -m "feat(admin): add AdminLayoutComponent with sidebar"
```

---

### Task 5: Dashboard Component

**Files:**
- Create: `frontend/src/app/pages/admin/dashboard/dashboard.component.ts`
- Create: `frontend/src/app/pages/admin/dashboard/dashboard.component.html`
- Create: `frontend/src/app/pages/admin/dashboard/dashboard.component.scss`

- [ ] **Step 1: Create dashboard.component.ts**

```typescript
// frontend/src/app/pages/admin/dashboard/dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, catchError, of } from 'rxjs';
import { AdminProductsService } from '../services-api/admin-products.service';
import { AdminHairstylesService } from '../services-api/admin-hairstyles.service';
import { AdminNailDesignsService } from '../services-api/admin-nail-designs.service';
import { AdminServicesService } from '../services-api/admin-services.service';
import { AdminUsersService } from '../services-api/admin-users.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private productsService = inject(AdminProductsService);
  private hairstylesService = inject(AdminHairstylesService);
  private nailDesignsService = inject(AdminNailDesignsService);
  private servicesService = inject(AdminServicesService);
  private usersService = inject(AdminUsersService);

  counts = signal({ products: 0, hairstyles: 0, nailDesigns: 0, services: 0, users: 0 });
  recentUsers = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    forkJoin({
      products:    this.productsService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      hairstyles:  this.hairstylesService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      nailDesigns: this.nailDesignsService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      services:    this.servicesService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
      users:       this.usersService.findAll(1,1,true).pipe(catchError(() => of({ total: 0 }))),
    }).subscribe(results => {
      this.counts.set({
        products:    (results.products as any).total ?? 0,
        hairstyles:  (results.hairstyles as any).total ?? 0,
        nailDesigns: (results.nailDesigns as any).total ?? 0,
        services:    (results.services as any).total ?? 0,
        users:       (results.users as any).total ?? 0,
      });
      this.loading.set(false);
    });

    this.usersService.findAll(1, 5, false).subscribe({
      next: res => this.recentUsers.set(res.data),
      error: () => {},
    });
  }
}
```

- [ ] **Step 2: Create dashboard.component.html**

```html
<!-- frontend/src/app/pages/admin/dashboard/dashboard.component.html -->
<div class="dashboard">
  <h2 class="dashboard-title">Dashboard</h2>

  @if (loading()) {
    <div class="loading">Cargando...</div>
  } @else {
    <div class="cards-grid">
      <div class="stat-card">
        <i class="fas fa-box stat-card__icon"></i>
        <div class="stat-card__info">
          <span class="stat-card__number">{{ counts().products }}</span>
          <span class="stat-card__label">Productos</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fas fa-cut stat-card__icon"></i>
        <div class="stat-card__info">
          <span class="stat-card__number">{{ counts().hairstyles }}</span>
          <span class="stat-card__label">Peinados</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fas fa-paint-brush stat-card__icon"></i>
        <div class="stat-card__info">
          <span class="stat-card__number">{{ counts().nailDesigns }}</span>
          <span class="stat-card__label">Diseños de Uñas</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fas fa-spa stat-card__icon"></i>
        <div class="stat-card__info">
          <span class="stat-card__number">{{ counts().services }}</span>
          <span class="stat-card__label">Servicios</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fas fa-users stat-card__icon"></i>
        <div class="stat-card__info">
          <span class="stat-card__number">{{ counts().users }}</span>
          <span class="stat-card__label">Usuarios</span>
        </div>
      </div>
    </div>
  }

  <div class="recent-users">
    <h3 class="section-title">Usuarios Recientes</h3>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Nombre</th>
          <th>Rol</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        @for (user of recentUsers(); track user.id) {
          <tr>
            <td>{{ user.email }}</td>
            <td>{{ user.firstName }} {{ user.lastName }}</td>
            <td><span class="badge badge--{{ user.role }}">{{ user.role }}</span></td>
            <td>
              <span class="badge" [class.badge--active]="user.isActive" [class.badge--inactive]="!user.isActive">
                {{ user.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
</div>
```

- [ ] **Step 3: Create dashboard.component.scss**

```scss
// frontend/src/app/pages/admin/dashboard/dashboard.component.scss
.dashboard-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #111;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 36px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);

  &__icon {
    font-size: 28px;
    color: #e6007e;
    width: 36px;
    text-align: center;
  }

  &__number {
    display: block;
    font-size: 28px;
    font-weight: 700;
    font-family: var(--font-heading);
    color: #111;
  }

  &__label {
    font-size: 13px;
    color: var(--text-secondary);
  }
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.loading {
  color: var(--text-secondary);
  padding: 20px 0;
}

// Shared admin table styles (used by all CRUD sections too)
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);

  th, td {
    padding: 12px 16px;
    text-align: left;
    font-size: 14px;
  }

  th {
    background: #f9f9f9;
    font-weight: 600;
    color: #333;
    border-bottom: 1px solid var(--gray-300);
  }

  td { border-bottom: 1px solid var(--gray-200); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  &--active, &--user  { background: #d4edda; color: #1a7a4a; }
  &--inactive          { background: #f8d7da; color: #721c24; }
  &--admin             { background: #fff3cd; color: #856404; }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

- [ ] **Step 5: Commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/dashboard/
git commit -m "feat(admin): add Dashboard with summary cards and recent users"
```

---

## Chunk 4: CRUD Components

> Each CRUD component follows the same structure. The pattern is shown in full for Products; Hairstyles, Nail Designs, Services, and Users follow the same pattern with entity-specific fields.

### Task 6: Admin Products CRUD

**Files:**
- Create: `frontend/src/app/pages/admin/products/products.component.ts`
- Create: `frontend/src/app/pages/admin/products/products.component.html`
- Create: `frontend/src/app/pages/admin/products/products.component.scss`

- [ ] **Step 1: Create products.component.ts**

```typescript
// frontend/src/app/pages/admin/products/products.component.ts
import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminProductsService } from '../services-api/admin-products.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  private service = inject(AdminProductsService);
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  items = signal<any[]>([]);
  total = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  limit = 20;
  showInactive = signal(false);
  loading = signal(false);

  showModal = signal(false);
  editingItem = signal<any>(null);
  modalError = signal('');
  saving = signal(false);

  form!: FormGroup;

  ngOnInit() {
    this.buildForm();
    this.loadData();
  }

  buildForm(item?: any) {
    this.form = this.fb.group({
      name:        [item?.name ?? '',        Validators.required],
      description: [item?.description ?? '', Validators.required],
      price:       [item?.price ?? 0,        [Validators.required, Validators.min(0)]],
      category:    [item?.category ?? '',    Validators.required],
      subcategory: [item?.subcategory ?? ''],
      stock:       [item?.stock ?? 0,        [Validators.required, Validators.min(0)]],
      image_url:   [item?.image_url ?? ''],
      rating:      [item?.rating ?? 0,       [Validators.min(0), Validators.max(5)]],
      target_age:  [item?.target_age ?? ''],
    });
  }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => {
        this.items.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.show('Error al cargar productos', 'error');
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.editingItem.set(null);
    this.buildForm();
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(item: any) {
    this.editingItem.set(item);
    this.buildForm(item);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showModal()) this.closeModal(); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.modalError.set('');
    const dto = this.form.value;
    const action = this.editingItem()
      ? this.service.update(this.editingItem().id, dto)
      : this.service.create(dto);

    action.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadData();
        this.toastService.show('Guardado correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error del servidor';
        if (err.status >= 500) {
          this.toastService.show('Error del servidor, intenta de nuevo', 'error');
        } else {
          this.modalError.set(Array.isArray(msg) ? msg.join(', ') : msg);
        }
      },
    });
  }

  deactivate(item: any) {
    this.service.deactivate(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Producto desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(item: any) {
    this.service.restore(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Producto restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(item: any) {
    if (!confirm(`¿Eliminar permanentemente "${item.name}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Producto eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}
```

- [ ] **Step 2: Create products.component.html**

```html
<!-- frontend/src/app/pages/admin/products/products.component.html -->
<div class="crud-page">
  <div class="crud-toolbar">
    <h2 class="crud-title">Productos</h2>
    <div class="crud-toolbar__actions">
      <label class="toggle-label">
        <input type="checkbox" [checked]="showInactive()" (change)="toggleInactive()">
        Mostrar inactivos
      </label>
      <button class="btn btn--primary" (click)="openCreate()">
        <i class="fas fa-plus"></i> Nuevo
      </button>
    </div>
  </div>

  @if (loading()) {
    <div class="loading">Cargando...</div>
  } @else {
    <table class="admin-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Categoría</th>
          <th>Stock</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        @for (item of items(); track item.id) {
          <tr>
            <td>{{ item.name }}</td>
            <td>${{ item.price | number:'1.2-2' }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.stock }}</td>
            <td>
              <span class="badge" [class.badge--active]="item.is_active" [class.badge--inactive]="!item.is_active">
                {{ item.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="actions">
              <button class="icon-btn" title="Editar" (click)="openEdit(item)">
                <i class="fas fa-edit"></i>
              </button>
              @if (item.is_active) {
                <button class="icon-btn icon-btn--warn" title="Desactivar" (click)="deactivate(item)">
                  <i class="fas fa-toggle-on"></i>
                </button>
              } @else {
                <button class="icon-btn icon-btn--success" title="Restaurar" (click)="restore(item)">
                  <i class="fas fa-toggle-off"></i>
                </button>
                <button class="icon-btn icon-btn--danger" title="Eliminar permanentemente" (click)="remove(item)">
                  <i class="fas fa-trash"></i>
                </button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>

    <div class="pagination">
      <button class="btn btn--outline" [disabled]="currentPage() === 1" (click)="prevPage()">← Anterior</button>
      <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
      <button class="btn btn--outline" [disabled]="currentPage() === totalPages()" (click)="nextPage()">Siguiente →</button>
    </div>
  }
</div>

<!-- MODAL -->
@if (showModal()) {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>{{ editingItem() ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
        <button class="modal-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input formControlName="name" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>Categoría *</label>
            <input formControlName="category" type="text" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>Descripción *</label>
          <textarea formControlName="description" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Precio *</label>
            <input formControlName="price" type="number" min="0" step="0.01" class="form-control">
          </div>
          <div class="form-group">
            <label>Stock *</label>
            <input formControlName="stock" type="number" min="0" class="form-control">
          </div>
          <div class="form-group">
            <label>Subcategoría</label>
            <input formControlName="subcategory" type="text" class="form-control">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Imagen URL</label>
            <input formControlName="image_url" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>Rating (0–5)</label>
            <input formControlName="rating" type="number" min="0" max="5" step="0.1" class="form-control">
          </div>
          <div class="form-group">
            <label>Target Age</label>
            <input formControlName="target_age" type="text" class="form-control">
          </div>
        </div>

        @if (modalError()) {
          <div class="modal-error">{{ modalError() }}</div>
        }

        <div class="modal-footer">
          <button type="button" class="btn btn--outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">
            {{ saving() ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
}
```

- [ ] **Step 3: Create products.component.scss**

```scss
// frontend/src/app/pages/admin/products/products.component.scss
@import '../shared-admin.scss';
```

> Note: `shared-admin.scss` contains all shared CRUD styles. Create this file as part of this step:

```scss
// frontend/src/app/pages/admin/shared-admin.scss
// Shared styles for all admin CRUD pages — import in each component's .scss

.crud-page { }

.crud-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  &__actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.crud-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  color: #111;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.btn {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: var(--font-body);
  transition: opacity 0.2s;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: #e6007e;
    color: #fff;
    &:hover:not(:disabled) { background: #b3005e; }
  }

  &--outline {
    background: transparent;
    border: 1.5px solid var(--gray-300);
    color: #333;
    &:hover:not(:disabled) { border-color: #999; }
  }

  &--danger {
    background: #dc3545;
    color: #fff;
    &:hover:not(:disabled) { background: #b02a37; }
  }
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 15px;
  color: #555;
  transition: background 0.15s;
  &:hover { background: var(--gray-200); }
  &--warn    { color: #e6a817; }
  &--success { color: #1a7a4a; }
  &--danger  { color: #dc3545; }
}

.actions { white-space: nowrap; }

.pagination {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}

.loading { color: var(--text-secondary); padding: 20px 0; }

// Admin table (also in dashboard.component.scss — keep consistent)
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);

  th, td { padding: 12px 16px; text-align: left; font-size: 14px; }
  th { background: #f9f9f9; font-weight: 600; color: #333; border-bottom: 1px solid var(--gray-300); }
  td { border-bottom: 1px solid var(--gray-200); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  &--active, &--user  { background: #d4edda; color: #1a7a4a; }
  &--inactive          { background: #f8d7da; color: #721c24; }
  &--admin             { background: #fff3cd; color: #856404; }
}

// Modal
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--gray-200);

  h3 { font-family: var(--font-heading); font-size: 18px; font-weight: 700; }
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  &:hover { color: #333; }
}

.modal-form { padding: 20px 24px; }

.form-row {
  display: flex;
  gap: 12px;
  .form-group { flex: 1; }
}

.form-group {
  margin-bottom: 14px;
  label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #444; }
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid var(--gray-300);
  border-radius: 6px;
  font-size: 14px;
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: #e6007e; }
}

textarea.form-control { resize: vertical; }

.modal-error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--gray-200);
  margin-top: 16px;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

- [ ] **Step 5: Commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/products/ frontend/src/app/pages/admin/shared-admin.scss
git commit -m "feat(admin): add Products CRUD component with modal"
```

---

### Task 7: Admin Hairstyles CRUD

**Files:**
- Create: `frontend/src/app/pages/admin/hairstyles/hairstyles.component.ts`
- Create: `frontend/src/app/pages/admin/hairstyles/hairstyles.component.html`
- Create: `frontend/src/app/pages/admin/hairstyles/hairstyles.component.scss`

- [ ] **Step 1: Create hairstyles.component.ts**

Same pattern as ProductsComponent. Replace service and fields:

```typescript
// frontend/src/app/pages/admin/hairstyles/hairstyles.component.ts
import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminHairstylesService } from '../services-api/admin-hairstyles.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-hairstyles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hairstyles.component.html',
  styleUrls: ['./hairstyles.component.scss'],
})
export class HairstylesComponent implements OnInit {
  private service = inject(AdminHairstylesService);
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  items = signal<any[]>([]);
  total = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  limit = 20;
  showInactive = signal(false);
  loading = signal(false);
  showModal = signal(false);
  editingItem = signal<any>(null);
  modalError = signal('');
  saving = signal(false);
  form!: FormGroup;

  ngOnInit() { this.buildForm(); this.loadData(); }

  buildForm(item?: any) {
    this.form = this.fb.group({
      name:        [item?.name ?? '',        Validators.required],
      description: [item?.description ?? '', Validators.required],
      process:     [item?.process ?? '',     Validators.required],
      duration:    [item?.duration ?? ''],
      price:       [item?.price ?? null,     Validators.min(0)],
      category:    [item?.category ?? ''],
      image_url:   [item?.image_url ?? ''],
    });
  }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => { this.items.set(res.data); this.total.set(res.total); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => { this.toastService.show('Error al cargar peinados', 'error'); this.loading.set(false); },
    });
  }

  openCreate() { this.editingItem.set(null); this.buildForm(); this.modalError.set(''); this.showModal.set(true); }
  openEdit(item: any) { this.editingItem.set(item); this.buildForm(item); this.modalError.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showModal()) this.closeModal(); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.modalError.set('');
    const dto = this.form.value;
    const action = this.editingItem() ? this.service.update(this.editingItem().id, dto) : this.service.create(dto);
    action.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadData(); this.toastService.show('Guardado correctamente'); },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error';
        if (err.status >= 500) this.toastService.show('Error del servidor', 'error');
        else this.modalError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  deactivate(item: any) {
    this.service.deactivate(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Peinado desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(item: any) {
    this.service.restore(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Peinado restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(item: any) {
    if (!confirm(`¿Eliminar permanentemente "${item.name}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Peinado eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}
```

- [ ] **Step 2: Create hairstyles.component.html**

Same structure as products.component.html. Key differences:
- Title: "Peinados"
- Table columns: Nombre, Categoría, Duración, Precio, Estado, Acciones
- Table data: `item.name`, `item.category`, `item.duration`, `item.price`, `item.is_available`
- Status badge uses `item.is_available` (not `item.is_active`)
- Modal fields: nombre*, descripción*, proceso*, duración, precio, categoría, imagen URL

```html
<!-- frontend/src/app/pages/admin/hairstyles/hairstyles.component.html -->
<div class="crud-page">
  <div class="crud-toolbar">
    <h2 class="crud-title">Peinados</h2>
    <div class="crud-toolbar__actions">
      <label class="toggle-label">
        <input type="checkbox" [checked]="showInactive()" (change)="toggleInactive()">
        Mostrar inactivos
      </label>
      <button class="btn btn--primary" (click)="openCreate()">
        <i class="fas fa-plus"></i> Nuevo
      </button>
    </div>
  </div>

  @if (loading()) {
    <div class="loading">Cargando...</div>
  } @else {
    <table class="admin-table">
      <thead>
        <tr><th>Nombre</th><th>Categoría</th><th>Duración</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        @for (item of items(); track item.id) {
          <tr>
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.duration }}</td>
            <td>{{ item.price ? ('$' + item.price) : '—' }}</td>
            <td>
              <span class="badge" [class.badge--active]="item.is_available" [class.badge--inactive]="!item.is_available">
                {{ item.is_available ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="actions">
              <button class="icon-btn" title="Editar" (click)="openEdit(item)"><i class="fas fa-edit"></i></button>
              @if (item.is_available) {
                <button class="icon-btn icon-btn--warn" title="Desactivar" (click)="deactivate(item)"><i class="fas fa-toggle-on"></i></button>
              } @else {
                <button class="icon-btn icon-btn--success" title="Restaurar" (click)="restore(item)"><i class="fas fa-toggle-off"></i></button>
                <button class="icon-btn icon-btn--danger" title="Eliminar" (click)="remove(item)"><i class="fas fa-trash"></i></button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>

    <div class="pagination">
      <button class="btn btn--outline" [disabled]="currentPage() === 1" (click)="prevPage()">← Anterior</button>
      <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
      <button class="btn btn--outline" [disabled]="currentPage() === totalPages()" (click)="nextPage()">Siguiente →</button>
    </div>
  }
</div>

@if (showModal()) {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>{{ editingItem() ? 'Editar Peinado' : 'Nuevo Peinado' }}</h3>
        <button class="modal-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input formControlName="name" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <input formControlName="category" type="text" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>Descripción *</label>
          <textarea formControlName="description" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>Proceso *</label>
          <textarea formControlName="process" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Duración</label>
            <input formControlName="duration" type="text" class="form-control" placeholder="ej: 45 min">
          </div>
          <div class="form-group">
            <label>Precio</label>
            <input formControlName="price" type="number" min="0" step="0.01" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>Imagen URL</label>
          <input formControlName="image_url" type="text" class="form-control">
        </div>
        @if (modalError()) { <div class="modal-error">{{ modalError() }}</div> }
        <div class="modal-footer">
          <button type="button" class="btn btn--outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  </div>
}
```

- [ ] **Step 3: Create hairstyles.component.scss**

```scss
// frontend/src/app/pages/admin/hairstyles/hairstyles.component.scss
@import '../shared-admin.scss';
```

- [ ] **Step 4: Verify and commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/hairstyles/
git commit -m "feat(admin): add Hairstyles CRUD component"
```

---

### Task 8: Admin Nail Designs CRUD

**Files:**
- Create: `frontend/src/app/pages/admin/nail-designs/nail-designs.component.ts`
- Create: `frontend/src/app/pages/admin/nail-designs/nail-designs.component.html`
- Create: `frontend/src/app/pages/admin/nail-designs/nail-designs.component.scss`

- [ ] **Step 1: Create nail-designs.component.ts**

Same pattern as HairstylesComponent. Replace service with `AdminNailDesignsService`. Form fields:

```typescript
// frontend/src/app/pages/admin/nail-designs/nail-designs.component.ts
import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminNailDesignsService } from '../services-api/admin-nail-designs.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-nail-designs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './nail-designs.component.html',
  styleUrls: ['./nail-designs.component.scss'],
})
export class NailDesignsComponent implements OnInit {
  private service = inject(AdminNailDesignsService);
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  items = signal<any[]>([]);
  total = signal(0); totalPages = signal(1); currentPage = signal(1);
  limit = 20; showInactive = signal(false); loading = signal(false);
  showModal = signal(false); editingItem = signal<any>(null);
  modalError = signal(''); saving = signal(false);
  form!: FormGroup;

  ngOnInit() { this.buildForm(); this.loadData(); }

  buildForm(item?: any) {
    this.form = this.fb.group({
      name:        [item?.name ?? '',        Validators.required],
      description: [item?.description ?? '', Validators.required],
      process:     [item?.process ?? '',     Validators.required],
      duration:    [item?.duration ?? ''],
      price:       [item?.price ?? null,     Validators.min(0)],
      style:       [item?.style ?? ''],
      image_url:   [item?.image_url ?? ''],
    });
  }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => { this.items.set(res.data); this.total.set(res.total); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => { this.toastService.show('Error al cargar diseños', 'error'); this.loading.set(false); },
    });
  }

  openCreate() { this.editingItem.set(null); this.buildForm(); this.modalError.set(''); this.showModal.set(true); }
  openEdit(item: any) { this.editingItem.set(item); this.buildForm(item); this.modalError.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showModal()) this.closeModal(); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.modalError.set('');
    const action = this.editingItem() ? this.service.update(this.editingItem().id, this.form.value) : this.service.create(this.form.value);
    action.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadData(); this.toastService.show('Guardado correctamente'); },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error';
        if (err.status >= 500) this.toastService.show('Error del servidor', 'error');
        else this.modalError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  deactivate(item: any) {
    this.service.deactivate(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Diseño desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(item: any) {
    this.service.restore(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Diseño restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(item: any) {
    if (!confirm(`¿Eliminar permanentemente "${item.name}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Diseño eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}
```

- [ ] **Step 2: Create nail-designs.component.html**

Same structure as hairstyles. Key differences:
- Title: "Diseños de Uñas"
- Table columns: Nombre, Estilo, Duración, Precio, Estado, Acciones — data: `item.style` instead of `item.category`
- Status uses `item.is_available`
- Modal: nombre*, descripción*, proceso*, duración, precio, estilo, imagen URL

```html
<!-- frontend/src/app/pages/admin/nail-designs/nail-designs.component.html -->
<div class="crud-page">
  <div class="crud-toolbar">
    <h2 class="crud-title">Diseños de Uñas</h2>
    <div class="crud-toolbar__actions">
      <label class="toggle-label">
        <input type="checkbox" [checked]="showInactive()" (change)="toggleInactive()">
        Mostrar inactivos
      </label>
      <button class="btn btn--primary" (click)="openCreate()"><i class="fas fa-plus"></i> Nuevo</button>
    </div>
  </div>

  @if (loading()) { <div class="loading">Cargando...</div> }
  @else {
    <table class="admin-table">
      <thead>
        <tr><th>Nombre</th><th>Estilo</th><th>Duración</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        @for (item of items(); track item.id) {
          <tr>
            <td>{{ item.name }}</td>
            <td>{{ item.style }}</td>
            <td>{{ item.duration }}</td>
            <td>{{ item.price ? ('$' + item.price) : '—' }}</td>
            <td>
              <span class="badge" [class.badge--active]="item.is_available" [class.badge--inactive]="!item.is_available">
                {{ item.is_available ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="actions">
              <button class="icon-btn" (click)="openEdit(item)"><i class="fas fa-edit"></i></button>
              @if (item.is_available) {
                <button class="icon-btn icon-btn--warn" (click)="deactivate(item)"><i class="fas fa-toggle-on"></i></button>
              } @else {
                <button class="icon-btn icon-btn--success" (click)="restore(item)"><i class="fas fa-toggle-off"></i></button>
                <button class="icon-btn icon-btn--danger" (click)="remove(item)"><i class="fas fa-trash"></i></button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>

    <div class="pagination">
      <button class="btn btn--outline" [disabled]="currentPage() === 1" (click)="prevPage()">← Anterior</button>
      <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
      <button class="btn btn--outline" [disabled]="currentPage() === totalPages()" (click)="nextPage()">Siguiente →</button>
    </div>
  }
</div>

@if (showModal()) {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>{{ editingItem() ? 'Editar Diseño' : 'Nuevo Diseño' }}</h3>
        <button class="modal-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input formControlName="name" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>Estilo</label>
            <input formControlName="style" type="text" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>Descripción *</label>
          <textarea formControlName="description" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>Proceso *</label>
          <textarea formControlName="process" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Duración</label>
            <input formControlName="duration" type="text" class="form-control" placeholder="ej: 60 min">
          </div>
          <div class="form-group">
            <label>Precio</label>
            <input formControlName="price" type="number" min="0" step="0.01" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>Imagen URL</label>
          <input formControlName="image_url" type="text" class="form-control">
        </div>
        @if (modalError()) { <div class="modal-error">{{ modalError() }}</div> }
        <div class="modal-footer">
          <button type="button" class="btn btn--outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  </div>
}
```

- [ ] **Step 3: Create nail-designs.component.scss**

```scss
// frontend/src/app/pages/admin/nail-designs/nail-designs.component.scss
@import '../shared-admin.scss';
```

- [ ] **Step 4: Verify and commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/nail-designs/
git commit -m "feat(admin): add Nail Designs CRUD component"
```

---

### Task 9: Admin Services CRUD

**Files:**
- Create: `frontend/src/app/pages/admin/services/services.component.ts`
- Create: `frontend/src/app/pages/admin/services/services.component.html`
- Create: `frontend/src/app/pages/admin/services/services.component.scss`

> Note: ID is a **UUID string** — no numeric casting needed.

- [ ] **Step 1: Create services.component.ts**

```typescript
// frontend/src/app/pages/admin/services/services.component.ts
import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminServicesService } from '../services-api/admin-services.service';
import { ToastService } from '../shared/toast.service';

const SERVICE_CATEGORIES = ['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure'];

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent implements OnInit {
  private service = inject(AdminServicesService);
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  categories = SERVICE_CATEGORIES;
  items = signal<any[]>([]);
  total = signal(0); totalPages = signal(1); currentPage = signal(1);
  limit = 20; showInactive = signal(false); loading = signal(false);
  showModal = signal(false); editingItem = signal<any>(null);
  modalError = signal(''); saving = signal(false);
  form!: FormGroup;

  ngOnInit() { this.buildForm(); this.loadData(); }

  buildForm(item?: any) {
    this.form = this.fb.group({
      name:        [item?.name ?? '',         Validators.required],
      description: [item?.description ?? '',  Validators.required],
      price:       [item?.price ?? 0,         [Validators.required, Validators.min(0)]],
      duration:    [item?.duration ?? 60,     [Validators.required, Validators.min(1)]],
      category:    [item?.category ?? 'facial', Validators.required],
      imageUrl:    [item?.imageUrl ?? ''],
    });
  }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => { this.items.set(res.data); this.total.set(res.total); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => { this.toastService.show('Error al cargar servicios', 'error'); this.loading.set(false); },
    });
  }

  openCreate() { this.editingItem.set(null); this.buildForm(); this.modalError.set(''); this.showModal.set(true); }
  openEdit(item: any) { this.editingItem.set(item); this.buildForm(item); this.modalError.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showModal()) this.closeModal(); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.modalError.set('');
    const action = this.editingItem()
      ? this.service.update(this.editingItem().id, this.form.value)
      : this.service.create(this.form.value);
    action.subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadData(); this.toastService.show('Guardado correctamente'); },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error';
        if (err.status >= 500) this.toastService.show('Error del servidor', 'error');
        else this.modalError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  deactivate(item: any) {
    this.service.deactivate(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Servicio desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(item: any) {
    this.service.restore(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Servicio restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(item: any) {
    if (!confirm(`¿Eliminar permanentemente "${item.name}"?`)) return;
    this.service.remove(item.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Servicio eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}
```

- [ ] **Step 2: Create services.component.html**

Key differences vs products: uses `item.isActive` (camelCase), `imageUrl` (camelCase), category is a `<select>`.

```html
<!-- frontend/src/app/pages/admin/services/services.component.html -->
<div class="crud-page">
  <div class="crud-toolbar">
    <h2 class="crud-title">Servicios</h2>
    <div class="crud-toolbar__actions">
      <label class="toggle-label">
        <input type="checkbox" [checked]="showInactive()" (change)="toggleInactive()">
        Mostrar inactivos
      </label>
      <button class="btn btn--primary" (click)="openCreate()"><i class="fas fa-plus"></i> Nuevo</button>
    </div>
  </div>

  @if (loading()) { <div class="loading">Cargando...</div> }
  @else {
    <table class="admin-table">
      <thead>
        <tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Duración (min)</th><th>Estado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        @for (item of items(); track item.id) {
          <tr>
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td>${{ item.price }}</td>
            <td>{{ item.duration }} min</td>
            <td>
              <span class="badge" [class.badge--active]="item.isActive" [class.badge--inactive]="!item.isActive">
                {{ item.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="actions">
              <button class="icon-btn" (click)="openEdit(item)"><i class="fas fa-edit"></i></button>
              @if (item.isActive) {
                <button class="icon-btn icon-btn--warn" (click)="deactivate(item)"><i class="fas fa-toggle-on"></i></button>
              } @else {
                <button class="icon-btn icon-btn--success" (click)="restore(item)"><i class="fas fa-toggle-off"></i></button>
                <button class="icon-btn icon-btn--danger" (click)="remove(item)"><i class="fas fa-trash"></i></button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>

    <div class="pagination">
      <button class="btn btn--outline" [disabled]="currentPage() === 1" (click)="prevPage()">← Anterior</button>
      <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
      <button class="btn btn--outline" [disabled]="currentPage() === totalPages()" (click)="nextPage()">Siguiente →</button>
    </div>
  }
</div>

@if (showModal()) {
  <div class="modal-backdrop" (click)="closeModal()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>{{ editingItem() ? 'Editar Servicio' : 'Nuevo Servicio' }}</h3>
        <button class="modal-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input formControlName="name" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>Categoría *</label>
            <select formControlName="category" class="form-control">
              @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Descripción *</label>
          <textarea formControlName="description" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Precio *</label>
            <input formControlName="price" type="number" min="0" step="0.01" class="form-control">
          </div>
          <div class="form-group">
            <label>Duración (min) *</label>
            <input formControlName="duration" type="number" min="1" class="form-control">
          </div>
        </div>
        <div class="form-group">
          <label>Imagen URL</label>
          <input formControlName="imageUrl" type="text" class="form-control">
        </div>
        @if (modalError()) { <div class="modal-error">{{ modalError() }}</div> }
        <div class="modal-footer">
          <button type="button" class="btn btn--outline" (click)="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn--primary" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  </div>
}
```

- [ ] **Step 3: Create services.component.scss**

```scss
// frontend/src/app/pages/admin/services/services.component.scss
@import '../shared-admin.scss';
```

- [ ] **Step 4: Verify and commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/services/
git commit -m "feat(admin): add Services CRUD component (UUID IDs, category select)"
```

---

### Task 10: Admin Users CRUD

**Files:**
- Create: `frontend/src/app/pages/admin/users/users.component.ts`
- Create: `frontend/src/app/pages/admin/users/users.component.html`
- Create: `frontend/src/app/pages/admin/users/users.component.scss`

> No create form. Has a separate "Cambiar rol" modal. Uses `isActive` (camelCase), `firstName`/`lastName`.

- [ ] **Step 1: Create users.component.ts**

```typescript
// frontend/src/app/pages/admin/users/users.component.ts
import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsersService } from '../services-api/admin-users.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  private service = inject(AdminUsersService);
  toastService = inject(ToastService);

  items = signal<any[]>([]);
  total = signal(0); totalPages = signal(1); currentPage = signal(1);
  limit = 20; showInactive = signal(false); loading = signal(false);

  showRoleModal = signal(false);
  selectedUser = signal<any>(null);
  newRole = signal('user');
  roleError = signal('');
  saving = signal(false);

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.service.findAll(this.currentPage(), this.limit, this.showInactive()).subscribe({
      next: res => { this.items.set(res.data); this.total.set(res.total); this.totalPages.set(res.totalPages); this.loading.set(false); },
      error: () => { this.toastService.show('Error al cargar usuarios', 'error'); this.loading.set(false); },
    });
  }

  openRoleModal(user: any) {
    this.selectedUser.set(user);
    this.newRole.set(user.role);
    this.roleError.set('');
    this.showRoleModal.set(true);
  }

  closeRoleModal() { this.showRoleModal.set(false); }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.showRoleModal()) this.closeRoleModal(); }

  saveRole() {
    const user = this.selectedUser();
    if (!user) return;
    this.saving.set(true);
    this.service.updateRole(user.id, this.newRole()).subscribe({
      next: () => { this.saving.set(false); this.closeRoleModal(); this.loadData(); this.toastService.show('Rol actualizado'); },
      error: (err) => {
        this.saving.set(false);
        this.roleError.set(err?.error?.message ?? 'Error al actualizar rol');
      },
    });
  }

  deactivate(user: any) {
    this.service.deactivate(user.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Usuario desactivado', 'warning'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  restore(user: any) {
    this.service.restore(user.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Usuario restaurado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  remove(user: any) {
    if (!confirm(`¿Eliminar permanentemente a ${user.email}?`)) return;
    this.service.remove(user.id).subscribe({
      next: () => { this.loadData(); this.toastService.show('Usuario eliminado'); },
      error: (err) => this.toastService.show(err?.error?.message ?? 'Error', 'error'),
    });
  }

  canDelete(user: any): boolean { return !user.isActive && user.role !== 'admin'; }

  prevPage() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadData(); } }
  toggleInactive() { this.showInactive.update(v => !v); this.currentPage.set(1); this.loadData(); }
}
```

- [ ] **Step 2: Create users.component.html**

```html
<!-- frontend/src/app/pages/admin/users/users.component.html -->
<div class="crud-page">
  <div class="crud-toolbar">
    <h2 class="crud-title">Usuarios</h2>
    <div class="crud-toolbar__actions">
      <label class="toggle-label">
        <input type="checkbox" [checked]="showInactive()" (change)="toggleInactive()">
        Mostrar inactivos
      </label>
    </div>
  </div>

  @if (loading()) { <div class="loading">Cargando...</div> }
  @else {
    <table class="admin-table">
      <thead>
        <tr><th>Email</th><th>Nombre</th><th>Apellido</th><th>Rol</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        @for (user of items(); track user.id) {
          <tr>
            <td>{{ user.email }}</td>
            <td>{{ user.firstName }}</td>
            <td>{{ user.lastName }}</td>
            <td><span class="badge badge--{{ user.role }}">{{ user.role }}</span></td>
            <td>
              <span class="badge" [class.badge--active]="user.isActive" [class.badge--inactive]="!user.isActive">
                {{ user.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
            <td class="actions">
              <button class="icon-btn" title="Cambiar rol" (click)="openRoleModal(user)">
                <i class="fas fa-user-tag"></i>
              </button>
              @if (user.isActive) {
                <button class="icon-btn icon-btn--warn" title="Desactivar" (click)="deactivate(user)">
                  <i class="fas fa-toggle-on"></i>
                </button>
              } @else {
                <button class="icon-btn icon-btn--success" title="Restaurar" (click)="restore(user)">
                  <i class="fas fa-toggle-off"></i>
                </button>
                @if (canDelete(user)) {
                  <button class="icon-btn icon-btn--danger" title="Eliminar" (click)="remove(user)">
                    <i class="fas fa-trash"></i>
                  </button>
                }
              }
            </td>
          </tr>
        }
      </tbody>
    </table>

    <div class="pagination">
      <button class="btn btn--outline" [disabled]="currentPage() === 1" (click)="prevPage()">← Anterior</button>
      <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
      <button class="btn btn--outline" [disabled]="currentPage() === totalPages()" (click)="nextPage()">Siguiente →</button>
    </div>
  }
</div>

<!-- ROLE MODAL -->
@if (showRoleModal()) {
  <div class="modal-backdrop" (click)="closeRoleModal()">
    <div class="modal" style="max-width: 360px" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Cambiar Rol</h3>
        <button class="modal-close" (click)="closeRoleModal()"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-form">
        <p style="font-size:14px; margin-bottom:12px; color:#555">
          Usuario: <strong>{{ selectedUser()?.email }}</strong>
        </p>
        <div class="form-group">
          <label>Rol</label>
          <select class="form-control" [ngModel]="newRole()" (ngModelChange)="newRole.set($event)">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        @if (roleError()) { <div class="modal-error">{{ roleError() }}</div> }
        <div class="modal-footer">
          <button type="button" class="btn btn--outline" (click)="closeRoleModal()">Cancelar</button>
          <button type="button" class="btn btn--primary" [disabled]="saving()" (click)="saveRole()">
            {{ saving() ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}
```

- [ ] **Step 3: Create users.component.scss**

```scss
// frontend/src/app/pages/admin/users/users.component.scss
@import '../shared-admin.scss';
```

- [ ] **Step 4: Final TypeScript compile check**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: zero errors.

- [ ] **Step 5: Final commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add frontend/src/app/pages/admin/users/
git commit -m "feat(admin): add Users CRUD component with role change modal"
```

---

## Verification

After all tasks complete, start the dev server and verify:

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npm start
```

- [ ] Navigate to `http://localhost:4200/admin` — should redirect to login (no session)
- [ ] Log in as `admin@elabeauty.com` / `Admin@Ela2026`
- [ ] Navigate to `http://localhost:4200/admin` — dashboard loads with counters
- [ ] Navigate to `/admin/productos` — table loads, "+ Nuevo" opens modal
- [ ] Create a product — success toast appears
- [ ] Deactivate a product — badge changes to "Inactivo"
- [ ] Restore the product — badge returns to "Activo"
- [ ] Navigate to `/admin/usuarios` — users table loads
- [ ] Try accessing `/admin` in a new tab as a regular user — redirected to home
