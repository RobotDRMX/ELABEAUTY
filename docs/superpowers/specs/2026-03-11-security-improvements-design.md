# Ela Beauty — Security & Architecture Improvements
**Date:** 2026-03-11
**Status:** Approved
**Approach:** Incremental by layer (backend first, then frontend)

---

## Context

Ela Beauty is a beauty platform (NestJS backend + Angular 17 frontend, MySQL via TypeORM) with a mix of e-commerce and beauty content (hairstyles, nail designs). A security audit identified critical vulnerabilities that need to be addressed before production.

---

## Backend Changes

### 1. `src/main.ts` — Global Configuration
- Add `ValidationPipe` globally with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Add `cookie-parser` middleware to read HttpOnly cookies
- Add `@nestjs/throttler` for global rate limiting (configurable per module)
- Add `helmet` for security headers (CSP, HSTS, X-Frame-Options, etc.)
- New packages required: `@nestjs/throttler`, `helmet`, `cookie-parser`, `@types/cookie-parser`

### 2. `src/auth/auth.module.ts` — Auth Refactor
- **JWT secret**: read exclusively from `.env` — no hardcoded fallback. App fails to start with a clear error if `JWT_SECRET` is missing
- **HttpOnly cookies**: login responds with `Set-Cookie` (httpOnly, secure, sameSite: strict) instead of returning `access_token` in the body
- **Dual tokens**:
  - `access_token`: 15 min expiry, HttpOnly cookie
  - `refresh_token`: 7 days expiry, HttpOnly cookie (separate)
- **New endpoint**: `POST /auth/refresh` — validates refresh token cookie and issues new access token
- **Rate limiting on login**: 5 attempts per minute per IP using throttler
- **Failed login logging**: log to console with IP, email, and timestamp

### 3. RBAC — Role-Based Access Control
- New decorator: `@Roles('admin')` using `SetMetadata`
- New guard: `RolesGuard` reads role from JWT payload validated by `JwtAuthGuard`
- New endpoint: `PATCH /users/:id/role` protected with `JwtAuthGuard + RolesGuard('admin')`
- `JwtStrategy.validate()` includes `role` in returned payload

### 4. `src/products/products.controller.ts` — Protected Endpoints
- `POST /products` → requires `JwtAuthGuard + @Roles('admin')`
- `POST /products/seed` → requires `JwtAuthGuard + @Roles('admin')`

### 5. `src/products/products.service.ts` — sortBy Whitelist
- Allowed columns whitelist: `['name', 'price', 'rating', 'created_at', 'stock']`
- If `sortBy` is not in the whitelist, falls back to `created_at`

### 6. Global Exception Filter
- `GlobalExceptionFilter` normalizes all error responses
- Does not expose stack traces in production (`NODE_ENV !== 'development'`)
- Consistent format: `{ statusCode, message, timestamp, path }`

### 7. `src/app.module.ts`
- `synchronize` defaults to `false` — requires explicit `DB_SYNCHRONIZE=true` in `.env` to enable

---

## Frontend Changes

### 1. `frontend/src/app/services/auth.service.ts` — Remove localStorage
- Remove all `localStorage.setItem/getItem/removeItem` for tokens
- Login/register use `withCredentials: true` — browser handles cookies automatically
- Non-sensitive user data (id, name, role) stored in `sessionStorage` for UI purposes only
- `checkSession()` calls `GET /auth/profile` with `withCredentials: true` on app startup to verify active session

### 2. `frontend/src/app/guards/auth.guard.ts` — Improved Guard
- Replace `isAuthenticated()` signal check with async call to `GET /auth/profile`
- If backend responds 401 (expired or invalid cookie), redirect to login
- Returns `Observable<boolean>` instead of plain boolean

### 3. `frontend/src/app/interceptors/auth.interceptor.ts` — New HTTP Interceptor
- Automatically adds `withCredentials: true` to all outgoing requests
- On 401 response: attempts `POST /auth/refresh` once automatically
- If refresh fails: calls `logout()` and redirects to login
- Removes need for manual `Authorization` headers in individual services

### 4. `frontend/src/app/app.routes.ts` — Admin Guard (prepared)
- Existing protected routes (`/perfil`, `/carrito`, `/favoritos`) keep `authGuard`
- `adminGuard` prepared for future admin routes

---

## Data Flow: Auth with HttpOnly Cookies

```
Login Request
  → POST /api/auth/login { email, password }
  ← Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
  ← Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict
  ← Body: { user: { id, email, firstName, lastName, role } }

Protected Request
  → GET /api/auth/profile (cookie sent automatically by browser)
  ← 200 { user data }

Token Expired
  → Any request → 401
  → POST /api/auth/refresh (refresh cookie sent automatically)
  ← Set-Cookie: access_token=... (new token)
  → Retry original request

Logout
  → POST /api/auth/logout
  ← Set-Cookie: access_token=; Max-Age=0 (cookie cleared server-side)
```

---

## Security Improvements Summary

| Issue | Fix | Priority |
|-------|-----|----------|
| SQL injection in sortBy | Whitelist validation | Critical |
| Hardcoded JWT secret fallback | Fail-fast on missing secret | Critical |
| Tokens in localStorage | HttpOnly cookies | Critical |
| No global ValidationPipe | Add to main.ts | Critical |
| Unprotected product endpoints | JwtAuthGuard + RolesGuard | Critical |
| No rate limiting | @nestjs/throttler on login | High |
| No security headers | helmet in main.ts | High |
| No refresh tokens | Dual cookie strategy | High |
| No exception filter | GlobalExceptionFilter | High |
| synchronize: true default | Default to false | High |
| Manual auth headers in services | AuthInterceptor | Medium |
| Auth guard checks only signal | Async backend validation | Medium |

---

## Packages to Install

**Backend:**
```bash
npm install @nestjs/throttler helmet cookie-parser
npm install -D @types/cookie-parser
```

**Frontend:**
No new packages required.

---

## Implementation Order

1. Backend: install packages → main.ts → auth.module.ts → RBAC → products → exception filter → app.module.ts
2. Frontend: auth.service.ts → auth.interceptor.ts → auth.guard.ts → app.routes.ts
