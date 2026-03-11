# Ela Beauty — Admin Panel Design Spec
**Date:** 2026-03-11
**Status:** Approved

---

## Overview

Full admin panel for Ela Beauty: backend CRUD APIs for all content types, Angular admin layout with sidebar, soft/hard delete flow, and MySQL seed script. Accessible at `/admin`, protected by `adminGuard` (role=admin).

---

## Section 1: Backend (NestJS)

### Architecture

Single `AdminModule` at `src/admin/` grouping all admin controllers. Every endpoint protected with `JwtAuthGuard + @Roles('admin')`. Follows existing monorepo patterns (entity + service + controller in module files or separate files).

### Entities Covered

| Entity | File | Soft-delete field | Status |
|--------|------|-------------------|--------|
| Product | `src/products/entities/product.entity.ts` | `is_active` | Exists, complete |
| Hairstyle | `src/hairstyles/hairstyles.module.ts` | `is_available` | Exists, needs CRUD |
| NailDesign | `src/nail-designs/nail-designs.module.ts` | `is_available` | Exists, needs CRUD |
| Service | `src/services/entities/service.entity.ts` | `isActive` | Exists, needs CRUD |
| User | `src/users/entities/user.entity.ts` | `isActive` | Exists, needs CRUD |

### New Files

```
src/admin/
  admin.module.ts           — imports all sub-controllers, exports nothing
  admin.controller.ts       — POST /admin/seed-admin endpoint
  admin.service.ts          — seed admin logic
  products/
    admin-products.controller.ts
    admin-products.service.ts
    dto/update-product.dto.ts
  hairstyles/
    admin-hairstyles.controller.ts
    admin-hairstyles.service.ts
    dto/create-hairstyle.dto.ts
    dto/update-hairstyle.dto.ts
  nail-designs/
    admin-nail-designs.controller.ts
    admin-nail-designs.service.ts
    dto/create-nail-design.dto.ts
    dto/update-nail-design.dto.ts
  services/
    admin-services.controller.ts
    admin-services.service.ts
    dto/create-service.dto.ts
    dto/update-service.dto.ts
  users/
    admin-users.controller.ts
    admin-users.service.ts
```

### Endpoint Pattern (repeated for each entity)

All under `/api/admin/*`, all require `JwtAuthGuard + @Roles('admin')`:

```
GET    /admin/products           — list all (active + inactive), with pagination
POST   /admin/products           — create
PATCH  /admin/products/:id       — update fields
PATCH  /admin/products/:id/deactivate  — soft delete (is_active = false)
PATCH  /admin/products/:id/restore     — restore (is_active = true)
DELETE /admin/products/:id       — hard delete (only allowed if is_active = false)
```

Same pattern for: `hairstyles`, `nail-designs`, `services`, `users`.

### Seed Admin Endpoint

```
POST /api/admin/seed-admin
```
- No auth required (first-run only)
- Creates admin user if zero admins exist in DB
- Returns 409 Conflict if any admin already exists
- Credentials: email `admin@elabeauty.com`, password `Admin@Ela2026`

### Hard Delete Guard

`DELETE /:id` returns `400 Bad Request` if the record has `is_active = true` (or `isActive = true` for users/services). Must deactivate first.

---

## Section 2: Frontend (Angular 17)

### Route Structure

```
/admin                    → AdminComponent (layout shell) → redirect /admin/dashboard
/admin/dashboard          → AdminDashboardComponent
/admin/products           → AdminProductsComponent
/admin/hairstyles         → AdminHairstylesComponent
/admin/nail-designs       → AdminNailDesignsComponent
/admin/services           → AdminServicesComponent
/admin/users              → AdminUsersComponent
```

All routes under `/admin` protected by `adminGuard`.

### New Files

```
frontend/src/app/pages/admin/
  admin.component.ts/html/scss         — layout: sidebar + topbar + router-outlet
  dashboard/
    admin-dashboard.component.ts/html/scss
  products/
    admin-products.component.ts/html/scss
  hairstyles/
    admin-hairstyles.component.ts/html/scss
  nail-designs/
    admin-nail-designs.component.ts/html/scss
  services/
    admin-services.component.ts/html/scss
  users/
    admin-users.component.ts/html/scss

frontend/src/app/guards/
  admin.guard.ts                        — checks role=admin via backend profile

frontend/src/app/services/
  admin.service.ts                      — HTTP calls to /api/admin/*
```

### Layout

```
┌──────────────────────────────────────────────────────┐
│  TOPBAR (#1a1a2e): "ELA Beauty Admin" | usuario | logout │
├─────────────┬────────────────────────────────────────┤
│  SIDEBAR    │                                        │
│  (#1a1a2e)  │   CONTENT AREA (#f5f5f5)              │
│             │                                        │
│  Dashboard  │   <router-outlet>                      │
│  Productos  │   (tables, forms, dashboard cards)     │
│  Peinados   │                                        │
│  Uñas       │                                        │
│  Servicios  │                                        │
│  Usuarios   │                                        │
│             │                                        │
└─────────────┴────────────────────────────────────────┘
```

### Color System (Admin)

| Element | Color |
|---------|-------|
| Sidebar + Topbar background | `#1a1a2e` |
| Sidebar text | `#ffffff` |
| Active sidebar item | `#e6007e` (ELA Beauty pink) |
| Content background | `#f5f5f5` |
| Cards/tables | `#ffffff` |
| Deactivate button | `#f59e0b` (amber) |
| Restore button | `#10b981` (green) |
| Delete permanent button | `#ef4444` (red) |
| Create/Edit button | `#e6007e` (pink) |

### Table Columns Per Entity

**Products:** Imagen | Nombre | Categoría | Subcategoría | Precio | Stock | Estado | Acciones
**Hairstyles:** Imagen | Nombre | Categoría | Precio | Duración | Estado | Acciones
**Nail Designs:** Imagen | Nombre | Estilo | Precio | Duración | Estado | Acciones
**Services:** Nombre | Categoría | Precio | Duración | Estado | Acciones
**Users:** Nombre | Email | Rol | Estado | Fecha registro | Acciones

### Delete Flow (Option C — Two-step)

1. **Active record** → shows `Desactivar` button (amber)
2. **Inactive record** → shows badge "Inactivo" + `Restaurar` button (green) + `Eliminar permanentemente` button (red)
3. **Permanent delete** → confirmation modal requiring user to type `CONFIRMAR`

### Form Pattern

Slide-over panel (off-canvas Bootstrap) for create/edit. Does NOT navigate away from table. Closes on save or cancel.

### adminGuard

```typescript
// Calls GET /api/auth/profile, checks user.role === 'admin'
// Redirects to '/' if not admin (not to /auth/login)
```

---

## Section 3: Database — MySQL Script

### File

`ela-beauty-admin.sql` — idempotent script (safe to run multiple times).

### Contents

1. **Admin user INSERT** with bcrypt hash of `Admin@Ela2026` (12 rounds)
2. **Sample products** (extends existing seed data)
3. **Sample hairstyles** (peinados table)
4. **Sample nail designs** (nail_designs table)
5. **Sample services** (services table)

### Admin User Record

```sql
INSERT INTO users (email, password, firstName, lastName, role, isActive)
SELECT 'admin@elabeauty.com',
       '$2b$12$<bcrypt_hash_of_Admin@Ela2026>',
       'Admin', 'ELA Beauty', 'admin', 1
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE role = 'admin'
);
```

---

## Security Checklist

- [ ] All `/api/admin/*` endpoints require `JwtAuthGuard + @Roles('admin')`
- [ ] Hard delete blocked if record is active (backend validation)
- [ ] `POST /admin/seed-admin` returns 409 if admin already exists
- [ ] `adminGuard` validates role from backend (not from sessionStorage)
- [ ] Admin routes completely separate from public routes
- [ ] No admin endpoints exposed in public `ProductsController`
- [ ] Permanent delete requires typed confirmation in UI
- [ ] `ValidationPipe` (already global) validates all admin DTOs

---

## Implementation Order

1. Backend: AdminModule skeleton + seed-admin endpoint + SQL script
2. Backend: CRUD for Products (already has entity + public controller, add admin controller)
3. Backend: CRUD for Hairstyles, NailDesigns, Services, Users
4. Frontend: adminGuard + admin routes in app.routes.ts
5. Frontend: AdminComponent layout (sidebar + topbar)
6. Frontend: AdminDashboardComponent
7. Frontend: AdminProductsComponent (table + form)
8. Frontend: AdminHairstylesComponent, AdminNailDesignsComponent, AdminServicesComponent
9. Frontend: AdminUsersComponent
10. Frontend: admin.service.ts (HTTP layer)
