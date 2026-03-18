# Admin Panel Frontend — Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Angular frontend for the admin panel — lazy-loaded module with sidebar layout, 5 CRUD sections, modal forms, admin role guard.

---

## Overview

A separate dashboard-style admin panel accessible at `/admin`, built as a lazy-loaded Angular feature with its own routing. Uses ELA Beauty brand colors. Protected by an `adminGuard` that verifies `role === 'admin'` against the backend. All 5 backend CRUDs (Products, Hairstyles, Nail Designs, Services, Users) are accessible via sidebar navigation.

---

## Architecture

### Module structure (lazy-loaded)

```
frontend/src/app/pages/admin/
  admin.routes.ts                        ← feature routes
  layout/
    admin-layout.component.ts            ← sidebar shell + <router-outlet>
    admin-layout.component.html
    admin-layout.component.scss
  dashboard/
    dashboard.component.ts               ← /admin — summary cards + recent users
    dashboard.component.html
    dashboard.component.scss
  products/
    products.component.ts                ← /admin/productos
    products.component.html
    products.component.scss
  hairstyles/
    hairstyles.component.ts              ← /admin/peinados
    hairstyles.component.html
    hairstyles.component.scss
  nail-designs/
    nail-designs.component.ts            ← /admin/unas
    nail-designs.component.html
    nail-designs.component.scss
  services/
    services.component.ts                ← /admin/servicios
    services.component.html
    services.component.scss
  users/
    users.component.ts                   ← /admin/usuarios
    users.component.html
    users.component.scss
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

```ts
{
  path: 'admin',
  loadChildren: () =>
    import('./pages/admin/admin.routes').then(m => m.adminRoutes),
  canActivate: [adminGuard],
}
```

### admin.routes.ts

```ts
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'productos', component: ProductsComponent },
      { path: 'peinados', component: HairstylesComponent },
      { path: 'unas', component: NailDesignsComponent },
      { path: 'servicios', component: ServicesComponent },
      { path: 'usuarios', component: UsersComponent },
    ]
  }
];
```

---

## Guard

**File:** `admin/guards/admin.guard.ts`

- Calls `authService.getProfile()` (existing service)
- If response has `role === 'admin'` → allow
- If authenticated but not admin → redirect to `/` (home)
- If not authenticated → redirect to `/auth/login?returnUrl=/admin`

---

## Layout

### Sidebar (fixed left, 240px)

- ELA Beauty logo at top (`assets/logo/LOGOELAUNICO.jpg`)
- Navigation links with FontAwesome icons:
  - Dashboard (`fa-home`)
  - Productos (`fa-box`)
  - Peinados (`fa-cut`)
  - Diseños de Uñas (`fa-paint-brush`)
  - Servicios (`fa-spa`)
  - Usuarios (`fa-users`)
- Active link highlighted with `#e6007e` left border + background tint
- "Volver al sitio" link at bottom (`fa-arrow-left`)

### Content area (right of sidebar)

- Top bar: section title (h1) + logged-in admin name
- Main content: table + action buttons

---

## CRUD Sections (per entity)

Each section follows the same pattern:

### Table

| Column | Notes |
|--------|-------|
| Entity-specific fields | e.g. nombre, precio, categoría |
| Estado | badge: Activo (green) / Inactivo (red) |
| Acciones | Edit icon, Deactivate/Restore toggle, Delete (only if inactive) |

- Pagination: 20 per page
- Toggle: "Mostrar inactivos" checkbox

### Toolbar

- `+ Nuevo` button (pink, top right) → opens create modal
- Search/filter input (optional, nice-to-have)

### Modal (create & edit)

- Dark overlay, centered white card
- Form fields matching entity DTOs
- Real-time validation feedback
- Buttons: `Guardar` (pink) / `Cancelar` (gray)
- Closes on backdrop click or Escape key

---

## Per-entity field details

### Productos (`/admin/productos`)
Fields: nombre, descripción, precio, categoría, subcategoría, stock, imagen URL, rating, target_age
Soft-delete field: `is_active`

### Peinados (`/admin/peinados`)
Fields: nombre, descripción, proceso, duración, precio, categoría, imagen URL
Soft-delete field: `is_available`

### Diseños de Uñas (`/admin/unas`)
Fields: nombre, descripción, proceso, duración, precio, estilo, imagen URL
Soft-delete field: `is_available`

### Servicios (`/admin/servicios`)
Fields: nombre, descripción, precio, duración (min), categoría (enum), imagen URL
ID type: UUID string
Soft-delete field: `isActive`

### Usuarios (`/admin/usuarios`)
Fields (read-only view): email, nombre, apellido, rol, estado, fecha registro
Actions: cambiar rol (modal), desactivar, restaurar, eliminar (solo inactivos no-admin)
No create form (users register themselves)

---

## Services (Angular)

One service per entity in `admin/services-api/`. Each:
- Injects `HttpClient`
- Base URL: `/api/admin/<entity>`
- Methods: `findAll(page, limit, showInactive)`, `create(dto)`, `update(id, dto)`, `deactivate(id)`, `restore(id)`, `remove(id)`
- Cookies sent automatically via existing `AuthInterceptor`

---

## Visual Design

| Element | Value |
|---------|-------|
| Sidebar background | `#111111` |
| Sidebar text | `#ffffff` |
| Active link accent | `#e6007e` |
| Content background | `#f5f5f5` |
| Cards/tables background | `#ffffff` |
| Primary button | `#e6007e` |
| Font | Montserrat (heading), Open Sans (body) — already loaded |
| Shadows | `var(--shadow-sm)`, `var(--shadow-md)` from global styles |

---

## Error handling

- HTTP 401 → redirect to `/auth/login`
- HTTP 403 → show toast "No tienes permisos"
- HTTP 4xx → show error message in modal
- HTTP 5xx → show generic error toast

---

## Out of scope

- Analytics/charts on dashboard (future)
- Image upload (uses URL input only)
- Bulk operations
- Export CSV
