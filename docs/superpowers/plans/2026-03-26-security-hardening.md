# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 15 security vulnerabilities across the ELA Beauty backend and frontend, organized in 4 phases by severity.

**Architecture:** NestJS backend with TypeORM/PostgreSQL, Angular 17 frontend. Auth uses JWT in HttpOnly cookies. Changes span auth module, admin module, cart/favorites modules, events, CORS config, DB config, and the Angular interceptor/services.

**Tech Stack:** NestJS 11, TypeORM 0.3, Angular 17, PostgreSQL (Supabase), bcrypt, @simplewebauthn/server, face-api.js

---

## File Structure

### Files to Modify
- `src/main.ts` — CORS hardening (#3)
- `src/app.module.ts` — DB synchronize guard, SSL config (#9, #11)
- `src/auth/auth.module.ts` — CSRF removal via Authorization header, refresh token rotation, reCAPTCHA (#4, #5, #10, #14)
- `src/auth/dto/auth.dto.ts` — Face-only DTO update (add email), cart/favorites DTOs (#7, #12)
- `src/auth/face.service.ts` — AES-256 encryption, require email in face-only login (#6, #7)
- `src/auth/webauthn.service.ts` — Dynamic config from FRONTEND_URL, DB challenge store (#5, #8)
- `src/admin/admin.controller.ts` — Seed admin protection with secret + throttle (#2)
- `src/admin/admin.service.ts` — Read password from env (#2)
- `src/cart/cart.module.ts` — Add DTOs with validation (#12)
- `src/favorites/favorites.module.ts` — Add DTOs with validation (#12)
- `src/events/events.controller.ts` — Connection limit + minimal events (#13)
- `src/events/events.service.ts` — Connection tracking (#13)
- `src/users/entities/user.entity.ts` — Add refreshTokenHash column, add loginAttempts columns (#10, #15)
- `frontend/src/app/interceptors/auth.interceptor.ts` — Send Authorization header (#4)
- `frontend/src/app/services/auth.service.ts` — Store access_token in memory (#4)
- `frontend/src/app/services/biometric-auth.service.ts` — Add email to face-only login (#7)
- `frontend/src/app/pages/auth/login/login.component.ts` — Email for face login (#7)
- `frontend/src/app/pages/auth/login/login.component.html` — UX for email+face (#7)

### Files to Create
- `src/auth/entities/webauthn-challenge.entity.ts` — Challenge table entity (#8)
- `src/cart/dto/cart.dto.ts` — Cart DTOs (#12)
- `src/favorites/dto/favorites.dto.ts` — Favorites DTOs (#12)

---

## PHASE 1 — Critical (Tasks 1-4)

### Task 1: Ensure .env is gitignored and verify no tracked .env

**Files:**
- Verify: `.gitignore` (line 39 already has `.env`)

- [ ] **Step 1: Verify .env is not tracked by git**

Run: `git ls-files --error-unmatch .env 2>&1 || echo "NOT_TRACKED"`

Expected: `NOT_TRACKED` — confirming .env is already ignored.

If it IS tracked, run:
```bash
git rm --cached .env
git commit -m "chore: remove .env from tracking"
```

- [ ] **Step 2: Verify .gitignore has .env**

Read `.gitignore` line 39. It already contains `.env`. No changes needed.

- [ ] **Step 3: Commit if any changes were made**

```bash
git add .gitignore
git commit -m "security(#1): ensure .env is not tracked in git"
```

---

### Task 2: Protect seed-admin endpoint with secret key

**Files:**
- Modify: `src/admin/admin.controller.ts`
- Modify: `src/admin/admin.service.ts`

- [ ] **Step 1: Modify admin.controller.ts to require ADMIN_SEED_SECRET**

Replace the entire file with:

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  @Post('seed-admin')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ global: { limit: 1, ttl: 3600000 } })
  seedAdmin(@Body('secret') secret: string) {
    const expected = this.configService.get<string>('ADMIN_SEED_SECRET');
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Clave de seed invalida');
    }
    return this.adminService.seedAdmin();
  }
}
```

- [ ] **Step 2: Modify admin.service.ts to read password from env**

Replace the entire file with:

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async seedAdmin(): Promise<{ message: string; email: string }> {
    const existing = await this.userRepo.findOne({
      where: { role: 'admin', isActive: true },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un administrador activo. No se puede volver a ejecutar el seed.',
      );
    }

    const adminPassword = this.configService.get<string>('ADMIN_SEED_PASSWORD', 'Admin@Ela2026');
    const adminEmail = this.configService.get<string>('ADMIN_SEED_EMAIL', 'admin@elabeauty.com');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = this.userRepo.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      apellidoPaterno: 'ELA',
      apellidoMaterno: 'Beauty',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    await this.userRepo.save(admin);

    return {
      message: 'Administrador creado. Cambia la contrasena despues del primer login.',
      email: adminEmail,
    };
  }
}
```

- [ ] **Step 3: Add env vars to .env.example (if exists) or document**

Add to `.env` (for local dev):
```
ADMIN_SEED_SECRET=change-me-random-secret
ADMIN_SEED_PASSWORD=Admin@Ela2026
ADMIN_SEED_EMAIL=admin@elabeauty.com
```

- [ ] **Step 4: Verify the backend compiles**

Run: `cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty" && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/admin/admin.controller.ts src/admin/admin.service.ts
git commit -m "security(#2): protect seed-admin with ADMIN_SEED_SECRET and env-based credentials"
```

---

### Task 3: Fix CORS to project-specific pattern

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Replace CORS config with project-specific regex**

In `src/main.ts`, replace lines 33-50 (the entire `app.enableCors({...})` block) with:

```typescript
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        frontendUrl,
        'http://localhost:4200',
        'http://localhost:4300',
      ];
      // Allow only ela-beauty Vercel preview deployments (not arbitrary *.vercel.app)
      const isAllowedPreview = origin && /^https:\/\/ela-beauty(-[a-z0-9]+)?(-[a-z0-9]+)*\.vercel\.app$/.test(origin);
      if (!origin || allowed.includes(origin) || isAllowedPreview) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });
```

- [ ] **Step 2: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "security(#3): restrict CORS to ela-beauty Vercel previews only"
```

---

### Task 4: Guard DB_SYNCHRONIZE in production

**Files:**
- Modify: `src/app.module.ts`

- [ ] **Step 1: Add synchronize safety guard**

In `src/app.module.ts`, replace lines 52-53:

```typescript
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
```

With:

```typescript
        synchronize:
          configService.get<string>('NODE_ENV') !== 'production' &&
          configService.get<string>('DB_SYNCHRONIZE') === 'true',
```

- [ ] **Step 2: Add SSL rejectUnauthorized in production**

In `src/app.module.ts`, replace lines 55-57:

```typescript
        ssl: configService.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
```

With:

```typescript
        ssl: configService.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production' }
          : false,
```

- [ ] **Step 3: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app.module.ts
git commit -m "security(#9,#11): guard DB_SYNCHRONIZE in production, enable SSL verification in prod"
```

---

## PHASE 2 — High (Tasks 5-8)

### Task 5: Migrate auth from cookies to Authorization header (CSRF fix)

This is the largest task. It changes how tokens flow between frontend and backend.

**Strategy:**
- Backend: Keep refresh_token as HttpOnly cookie (secure). Return access_token in response body instead of cookie. Accept access_token from `Authorization: Bearer` header.
- Frontend: Store access_token in a memory variable (signal). Interceptor attaches it to every request. On refresh, update the in-memory token.

**Files:**
- Modify: `src/auth/auth.module.ts`
- Modify: `frontend/src/app/interceptors/auth.interceptor.ts`
- Modify: `frontend/src/app/services/auth.service.ts`
- Modify: `frontend/src/app/services/biometric-auth.service.ts`

- [ ] **Step 1: Modify JwtStrategy to read from Authorization header OR cookie**

In `src/auth/auth.module.ts`, replace the `super({...})` call in `JwtStrategy` constructor (lines 52-60) with:

```typescript
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Prefer Authorization: Bearer header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Fallback to cookie (for refresh endpoint and backwards compat)
        (request: Request) => {
          return (request?.cookies as Record<string, string>)?.['access_token'] ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
```

- [ ] **Step 2: Modify login to return access_token in body (keep refresh in cookie)**

In `src/auth/auth.module.ts`, replace the `login` method in `AuthController` (lines 398-410) with:

```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.authService.login(loginDto, ip);

    this.setRefreshCookie(res, result.refresh_token);
    return { user: result.user, access_token: result.access_token };
  }
```

- [ ] **Step 3: Modify refresh to return access_token in body**

Replace the `refresh` method (lines 413-435) with:

```typescript
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No hay refresh token');
    }

    const result = await this.authService.refresh(refreshToken);
    return { access_token: result.access_token };
  }
```

- [ ] **Step 4: Replace setCookies with setRefreshCookie (only refresh_token as cookie)**

Replace the `setCookies` method (lines 550-559) with:

```typescript
  private setRefreshCookie(res: Response, refreshToken: string): void {
    const isProd = process.env['NODE_ENV'] === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
```

- [ ] **Step 5: Update all login endpoints to use setRefreshCookie and return access_token**

Replace WebAuthn login verify (lines 472-485):

```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('webauthn/login/verify')
  async webauthnLoginVerify(
    @Body() body: WebAuthnVerifyAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.webAuthnService.verifyAuthentication(
      body.userId ?? null,
      body.authenticationResponse as unknown as AuthenticationResponseJSON,
    );
    const { password: _p, ...userResult } = user;
    const tokens = this.authService.issueTokenPair(userResult);
    this.setRefreshCookie(res, tokens.refresh_token);
    return { user: userResult, access_token: tokens.access_token };
  }
```

Replace face login (lines 498-522):

```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login/face')
  async loginWithFace(
    @Body() body: FaceLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.authService.login(body, ip);
    const user = result.user as Omit<User, 'password'>;

    if (body.faceDescriptor) {
      const { hasDescriptor, match } = await this.faceService.verifyDescriptor(
        user.id,
        body.faceDescriptor,
      );
      if (hasDescriptor && !match) {
        throw new UnauthorizedException('Rostro no reconocido');
      }
    }

    const tokens = this.authService.issueTokenPair(user);
    this.setRefreshCookie(res, tokens.refresh_token);
    return { user, access_token: tokens.access_token };
  }
```

Replace face-only login (lines 525-534):

```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login/face-only')
  async loginFaceOnly(
    @Body() body: FaceOnlyLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.faceService.findUserByFace(body.faceDescriptor);
    const tokens = this.authService.issueTokenPair(user);
    this.setRefreshCookie(res, tokens.refresh_token);
    return { user, access_token: tokens.access_token };
  }
```

Update logout to only clear refresh_token cookie (lines 437-443):

```typescript
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    return { message: 'Sesion cerrada' };
  }
```

- [ ] **Step 6: Update frontend AuthService to store access_token in memory**

Replace entire `frontend/src/app/services/auth.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiBaseUrl + '/auth';

  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(false);

  // In-memory token — never persisted to localStorage/sessionStorage
  private _accessToken: string | null = null;

  get accessToken(): string | null {
    return this._accessToken;
  }

  constructor(private http: HttpClient, private router: Router) {
    this.checkSession();
  }

  private checkSession() {
    // Try refreshing the token on startup (refresh_token is in HttpOnly cookie)
    this.http
      .post<{ access_token: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this._accessToken = res.access_token;
          // Now fetch profile with the new token
          this.http
            .get(`${this.apiUrl}/profile`)
            .subscribe({
              next: (user: any) => {
                this.currentUser.set(user);
                this.isAuthenticated.set(true);
                sessionStorage.setItem('user', JSON.stringify(user));
              },
              error: () => this.clearState(),
            });
        },
        error: () => this.clearState(),
      });
  }

  login(credentials: any): Observable<any> {
    return this.http
      .post<{ user: any; access_token: string }>(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((res) => {
          this._accessToken = res.access_token;
          this.currentUser.set(res.user);
          this.isAuthenticated.set(true);
          sessionStorage.setItem('user', JSON.stringify(res.user));
        }),
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, {
      withCredentials: true,
    });
  }

  logout() {
    this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => this.clearStateAndRedirect(),
        error: () => this.clearStateAndRedirect(),
      });
  }

  /** Called by interceptor after a successful token refresh */
  setAccessToken(token: string) {
    this._accessToken = token;
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/update`, data);
  }

  verifyEmail(token_hash: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-correo`, { token_hash, type: 'email' });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/olvide-contrasena`, { email });
  }

  resetPassword(token_hash: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/nueva-contrasena`, { token_hash, newPassword });
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reenviar-verificacion`, { email });
  }

  private clearState() {
    this._accessToken = null;
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    sessionStorage.removeItem('user');
  }

  private clearStateAndRedirect() {
    this.clearState();
    this.router.navigate(['/auth/login']);
  }
}
```

- [ ] **Step 7: Update auth interceptor to attach Authorization header and handle refresh**

Replace entire `frontend/src/app/interceptors/auth.interceptor.ts`:

```typescript
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
let refreshSubject = new Subject<string>();

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);

  // Clone with credentials (for refresh_token cookie) and Authorization header
  let cloned = req.clone({ withCredentials: true });

  const token = authService.accessToken;
  if (token) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register') &&
        !req.url.includes('/auth/refresh')
      ) {
        if (isRefreshing) {
          return refreshSubject.pipe(
            take(1),
            switchMap((newToken) => {
              const retried = req.clone({
                withCredentials: true,
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retried);
            }),
          );
        }

        isRefreshing = true;
        refreshSubject = new Subject<string>();
        const http = inject(HttpClient);
        const router = inject(Router);

        return http
          .post<{ access_token: string }>(
            `${environment.apiBaseUrl}/auth/refresh`,
            {},
            { withCredentials: true },
          )
          .pipe(
            switchMap((res) => {
              isRefreshing = false;
              authService.setAccessToken(res.access_token);
              refreshSubject.next(res.access_token);
              refreshSubject.complete();
              const retried = req.clone({
                withCredentials: true,
                setHeaders: { Authorization: `Bearer ${res.access_token}` },
              });
              return next(retried);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshSubject.error(refreshError);
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            }),
          );
      }

      return throwError(() => error);
    }),
  );
};
```

- [ ] **Step 8: Update BiometricAuthService login methods to capture access_token**

In `frontend/src/app/services/biometric-auth.service.ts`, add AuthService import and inject it:

After the existing `import { environment }` line, add:
```typescript
import { AuthService } from './auth.service';
```

In the constructor, add AuthService:
```typescript
constructor(private http: HttpClient, private authService: AuthService) {}
```

Update `loginWithPasskey` to capture the token (replace lines 43-58):
```typescript
  async loginWithPasskey(email?: string): Promise<any> {
    const body = email ? { email } : {};
    const result = await firstValueFrom(
      this.http.post<{ options: any; userId?: number }>(
        `${this.API}/webauthn/login/options`,
        body,
      ),
    );
    const authenticationResponse = await startAuthentication({ optionsJSON: result.options });
    const loginResult = await firstValueFrom(
      this.http.post<{ user: any; access_token: string }>(
        `${this.API}/webauthn/login/verify`,
        { email, userId: result.userId, authenticationResponse },
        { withCredentials: true },
      ),
    );
    this.authService.setAccessToken(loginResult.access_token);
    return loginResult;
  }
```

Update `loginWithFaceOnly` (replace lines 116-128):
```typescript
  async loginWithFaceOnly(): Promise<any> {
    const faceDescriptor = await this.captureDescriptor();
    if (!faceDescriptor) {
      throw new Error('No se detecto tu rostro. Mejora la iluminacion e intentalo de nuevo.');
    }
    const result = await firstValueFrom(
      this.http.post<{ user: any; access_token: string }>(
        `${this.API}/login/face-only`,
        { faceDescriptor },
        { withCredentials: true },
      ),
    );
    this.authService.setAccessToken(result.access_token);
    return result;
  }
```

Update `loginWithFace` (replace lines 131-143):
```typescript
  async loginWithFace(email: string, password: string): Promise<any> {
    const faceDescriptor = await this.captureDescriptor();
    if (!faceDescriptor) {
      throw new Error('No se detecto tu rostro. Usa email/contrasena o mejora la iluminacion.');
    }
    const result = await firstValueFrom(
      this.http.post<{ user: any; access_token: string }>(
        `${this.API}/login/face`,
        { email, password, faceDescriptor, recaptchaToken: 'face-auth' },
        { withCredentials: true },
      ),
    );
    this.authService.setAccessToken(result.access_token);
    return result;
  }
```

- [ ] **Step 9: Verify both frontend and backend compile**

Run:
```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty" && npx tsc --noEmit
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend" && npx ng build --configuration=development 2>&1 | head -20
```

- [ ] **Step 10: Commit**

```bash
git add src/auth/auth.module.ts frontend/src/app/interceptors/auth.interceptor.ts frontend/src/app/services/auth.service.ts frontend/src/app/services/biometric-auth.service.ts
git commit -m "security(#4): migrate auth from cookies to Authorization header, eliminating CSRF risk"
```

---

### Task 6: Make WebAuthn config dynamic from FRONTEND_URL

**Files:**
- Modify: `src/auth/webauthn.service.ts`

- [ ] **Step 1: Inject ConfigService and derive rpID/origin from FRONTEND_URL**

Replace the class properties and constructor in `src/auth/webauthn.service.ts` (lines 30-39) with:

```typescript
@Injectable()
export class WebAuthnService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const url = new URL(frontendUrl);
    this.rpID = url.hostname;
    this.origin = url.origin;
    this.rpName = 'ELA Beauty';
  }
```

Add the ConfigService import at top:
```typescript
import { ConfigService } from '@nestjs/config';
```

- [ ] **Step 2: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/auth/webauthn.service.ts
git commit -m "security(#5): derive WebAuthn rpID/origin from FRONTEND_URL dynamically"
```

---

### Task 7: Encrypt facial descriptors with AES-256-GCM

**Files:**
- Modify: `src/auth/face.service.ts`

- [ ] **Step 1: Add encryption/decryption helpers and update all descriptor operations**

Replace entire `src/auth/face.service.ts`:

```typescript
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FaceService {
  private readonly THRESHOLD = 0.45;
  private readonly encryptionKey: Buffer | null;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const keyHex = this.configService.get<string>('BIOMETRIC_ENCRYPTION_KEY');
    this.encryptionKey = keyHex ? Buffer.from(keyHex, 'hex') : null;
  }

  private encrypt(descriptor: number[]): string {
    if (!this.encryptionKey) {
      // Fallback: store as plain JSON if no key configured (dev only)
      return JSON.stringify(descriptor);
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const plaintext = JSON.stringify(descriptor);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: base64(iv + tag + ciphertext)
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decrypt(stored: string): number[] {
    // Try JSON parse first (legacy unencrypted data)
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON — must be encrypted
    }

    if (!this.encryptionKey) {
      throw new BadRequestException('Datos biometricos cifrados pero no hay clave de descifrado configurada');
    }

    const data = Buffer.from(stored, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const ciphertext = data.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  async saveDescriptor(userId: number, descriptor: number[]): Promise<{ saved: boolean }> {
    if (descriptor.length !== 128) {
      throw new BadRequestException('El descriptor facial debe tener exactamente 128 valores');
    }
    await this.userRepo.update(userId, { faceDescriptor: this.encrypt(descriptor) });
    return { saved: true };
  }

  async verifyDescriptor(
    userId: number,
    incoming: number[],
  ): Promise<{ hasDescriptor: boolean; match: boolean }> {
    if (incoming.length !== 128) {
      throw new BadRequestException('El descriptor facial entrante debe tener exactamente 128 valores');
    }
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.faceDescriptor) return { hasDescriptor: false, match: false };

    const stored = this.decrypt(user.faceDescriptor);
    const match = this.euclideanDistance(stored, incoming) < this.THRESHOLD;
    return { hasDescriptor: true, match };
  }

  async findUserByFace(incoming: number[], email?: string): Promise<Omit<User, 'password'>> {
    if (incoming.length !== 128) {
      throw new BadRequestException('Descriptor facial invalido');
    }

    let users: User[];
    if (email) {
      // Search only the specific user (O(1) instead of O(n))
      const user = await this.userRepo.findOne({
        where: { email, faceDescriptor: Not(IsNull()), isActive: true },
      });
      users = user ? [user] : [];
    } else {
      users = await this.userRepo.find({
        where: { faceDescriptor: Not(IsNull()), isActive: true },
      });
    }

    let bestMatch: User | null = null;
    let bestDistance = Infinity;

    for (const user of users) {
      const stored = this.decrypt(user.faceDescriptor!);
      const dist = this.euclideanDistance(stored, incoming);
      if (dist < this.THRESHOLD && dist < bestDistance) {
        bestMatch = user;
        bestDistance = dist;
      }
    }

    if (!bestMatch) {
      throw new UnauthorizedException('Rostro no reconocido. Asegurate de haber registrado tu cara en tu perfil.');
    }

    const { password, ...result } = bestMatch;
    return result as Omit<User, 'password'>;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}
```

- [ ] **Step 2: Generate a BIOMETRIC_ENCRYPTION_KEY and add to .env**

Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Add the output to `.env`:
```
BIOMETRIC_ENCRYPTION_KEY=<generated-hex-key>
```

- [ ] **Step 3: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/auth/face.service.ts
git commit -m "security(#6): encrypt facial descriptors with AES-256-GCM, backwards-compatible with legacy data"
```

---

### Task 8: Add DTOs to Cart and Favorites

**Files:**
- Create: `src/cart/dto/cart.dto.ts`
- Create: `src/favorites/dto/favorites.dto.ts`
- Modify: `src/cart/cart.module.ts`
- Modify: `src/favorites/favorites.module.ts`

- [ ] **Step 1: Create cart DTOs**

Create `src/cart/dto/cart.dto.ts`:

```typescript
import { IsInt, IsPositive, Min, Max, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @IsPositive()
  productId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;
}

export class UpdateCartQuantityDto {
  @IsInt()
  @Min(0)
  @Max(100)
  quantity!: number;
}
```

- [ ] **Step 2: Create favorites DTO**

Create `src/favorites/dto/favorites.dto.ts`:

```typescript
import { IsInt, IsPositive } from 'class-validator';

export class FavoriteParamDto {
  @IsInt()
  @IsPositive()
  productId!: number;
}
```

- [ ] **Step 3: Update CartController to use DTOs**

In `src/cart/cart.module.ts`, add imports at the top:

```typescript
import { Module, Injectable, Controller, Post, Get, Delete, Body, UseGuards, Req, Param, Patch, ParseIntPipe } from '@nestjs/common';
```

Add DTO import:
```typescript
import { AddToCartDto, UpdateCartQuantityDto } from './dto/cart.dto';
```

Replace `CartController` class (lines 75-104) with:

```typescript
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Req() req: any) {
        return this.cartService.findOrCreateCart(req.user.userId);
    }

    @Post('items')
    addItem(@Req() req: any, @Body() dto: AddToCartDto) {
        return this.cartService.addItem(req.user.userId, dto.productId, dto.quantity || 1);
    }

    @Patch('items/:productId')
    updateQuantity(
        @Req() req: any,
        @Param('productId', ParseIntPipe) productId: number,
        @Body() dto: UpdateCartQuantityDto,
    ) {
        return this.cartService.updateQuantity(req.user.userId, productId, dto.quantity);
    }

    @Delete('items/:productId')
    removeItem(@Req() req: any, @Param('productId', ParseIntPipe) productId: number) {
        return this.cartService.removeItem(req.user.userId, productId);
    }

    @Delete()
    clearCart(@Req() req: any) {
        return this.cartService.clearCart(req.user.userId);
    }
}
```

- [ ] **Step 4: Update FavoritesController to use ParseIntPipe**

In `src/favorites/favorites.module.ts`, update the import line:

```typescript
import { Module, Injectable, Controller, Post, Get, Delete, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
```

Replace `FavoritesController` class (lines 43-62) with:

```typescript
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Get()
    getFavorites(@Req() req: any) {
        return this.favoritesService.findAll(req.user.userId);
    }

    @Post(':productId')
    addFavorite(@Req() req: any, @Param('productId', ParseIntPipe) productId: number) {
        return this.favoritesService.add(req.user.userId, productId);
    }

    @Delete(':productId')
    removeFavorite(@Req() req: any, @Param('productId', ParseIntPipe) productId: number) {
        return this.favoritesService.remove(req.user.userId, productId);
    }
}
```

- [ ] **Step 5: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/cart/dto/cart.dto.ts src/favorites/dto/favorites.dto.ts src/cart/cart.module.ts src/favorites/favorites.module.ts
git commit -m "security(#12): add DTOs with validation to cart and favorites endpoints"
```

---

## PHASE 3 — Medium (Tasks 9-12)

### Task 9: Move WebAuthn challenges to database with TTL

**Files:**
- Create: `src/auth/entities/webauthn-challenge.entity.ts`
- Modify: `src/auth/webauthn.service.ts`
- Modify: `src/auth/auth.module.ts` (add entity to TypeOrmModule)

- [ ] **Step 1: Create the WebAuthnChallenge entity**

Create `src/auth/entities/webauthn-challenge.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webauthn_challenges')
export class WebAuthnChallenge {
  @PrimaryGeneratedColumn()
  id!: number;

  // NULL for discoverable credentials flow
  @Column({ nullable: true })
  userId!: number | null;

  @Column()
  challenge!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;
}
```

- [ ] **Step 2: Update auth.module.ts to include the entity**

In `src/auth/auth.module.ts`, add import:
```typescript
import { WebAuthnChallenge } from './entities/webauthn-challenge.entity';
```

Update `TypeOrmModule.forFeature` in the module definition (line 565):
```typescript
TypeOrmModule.forFeature([User, WebAuthnChallenge]),
```

- [ ] **Step 3: Rewrite webauthn.service.ts to use DB challenges with TTL**

Replace entire `src/auth/webauthn.service.ts`:

```typescript
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { WebAuthnChallenge } from './entities/webauthn-challenge.entity';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

interface StoredCredential {
  id: string;
  publicKey: string;
  counter: number;
  rpID: string;
}

@Injectable()
export class WebAuthnService {
  private readonly rpName: string;
  private readonly rpID: string;
  private readonly origin: string;
  private readonly CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WebAuthnChallenge)
    private readonly challengeRepo: Repository<WebAuthnChallenge>,
    private readonly configService: ConfigService,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const url = new URL(frontendUrl);
    this.rpID = url.hostname;
    this.origin = url.origin;
    this.rpName = 'ELA Beauty';
  }

  private async storeChallenge(userId: number | null, challenge: string): Promise<void> {
    // Remove any existing challenge for this user
    await this.challengeRepo.delete({ userId });
    await this.challengeRepo.save({
      userId,
      challenge,
      expiresAt: new Date(Date.now() + this.CHALLENGE_TTL_MS),
    });
  }

  private async consumeChallenge(userId: number | null): Promise<string> {
    const record = await this.challengeRepo.findOne({
      where: { userId },
    });
    if (!record || record.expiresAt < new Date()) {
      if (record) await this.challengeRepo.delete(record.id);
      throw new BadRequestException('Challenge no encontrado o expirado');
    }
    await this.challengeRepo.delete(record.id);
    return record.challenge;
  }

  // Clean up expired challenges every hour
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredChallenges(): Promise<void> {
    await this.challengeRepo.delete({ expiresAt: LessThan(new Date()) });
  }

  async generateRegistrationOptions(userId: number) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    const options = await generateRegistrationOptions({
      rpName:          this.rpName,
      rpID:            this.rpID,
      userID:          Buffer.from(String(user.id)),
      userName:        user.email,
      userDisplayName: `${user.firstName} ${user.apellidoPaterno}`,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey:      'preferred',
        userVerification: 'preferred',
      },
    });

    await this.storeChallenge(userId, options.challenge);
    return options;
  }

  async verifyRegistration(userId: number, response: RegistrationResponseJSON) {
    const expectedChallenge = await this.consumeChallenge(userId);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID:   this.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Registro WebAuthn fallido');
    }

    const { credential } = verification.registrationInfo;

    const stored: StoredCredential = {
      id:        credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter:   credential.counter,
      rpID:      this.rpID,
    };

    await this.userRepo.update(userId, {
      webauthnCredential: JSON.stringify(stored),
    });

    return { verified: true };
  }

  async generateAuthOptions(email?: string): Promise<{ options: any; userId?: number }> {
    if (!email) {
      const options = await generateAuthenticationOptions({
        rpID:             this.rpID,
        userVerification: 'preferred',
        allowCredentials: [],
      });
      await this.storeChallenge(null, options.challenge);
      return { options };
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user?.webauthnCredential) {
      throw new BadRequestException('Este usuario no tiene Passkey registrado');
    }

    const stored: StoredCredential = JSON.parse(user.webauthnCredential);

    const options = await generateAuthenticationOptions({
      rpID:             this.rpID,
      userVerification: 'preferred',
      allowCredentials: [{ id: stored.id }],
    });

    await this.storeChallenge(user.id, options.challenge);
    return { options, userId: user.id };
  }

  async verifyAuthentication(userId: number | null, response: AuthenticationResponseJSON): Promise<User> {
    let user: User;
    let challengeUserId: number | null;

    if (userId != null) {
      user = await this.userRepo.findOneOrFail({ where: { id: userId } });
      challengeUserId = userId;
    } else {
      user = await this.findUserByCredentialId(response.id);
      challengeUserId = null;
    }

    if (!user.webauthnCredential) throw new BadRequestException('Sin Passkey registrado');

    const expectedChallenge = await this.consumeChallenge(challengeUserId);
    const stored: StoredCredential = JSON.parse(user.webauthnCredential);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID:   this.rpID,
      credential: {
        id:        stored.id,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, 'base64url')),
        counter:   stored.counter,
      },
    });

    if (!verification.verified) throw new UnauthorizedException('Passkey invalido');

    stored.counter = verification.authenticationInfo.newCounter;
    await this.userRepo.update(user.id, { webauthnCredential: JSON.stringify(stored) });

    return user;
  }

  private async findUserByCredentialId(credentialId: string): Promise<User> {
    const users = await this.userRepo.find({
      where: { webauthnCredential: Not(IsNull()) },
    });
    const match = users.find(u => {
      const stored: StoredCredential = JSON.parse(u.webauthnCredential!);
      return stored.id === credentialId;
    });
    if (!match) throw new UnauthorizedException('Passkey no encontrado');
    return match;
  }
}
```

- [ ] **Step 4: Install @nestjs/schedule if not present and add ScheduleModule**

Run: `cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty" && npm ls @nestjs/schedule 2>&1 | head -5`

If not installed:
```bash
npm install @nestjs/schedule
```

Add to `src/app.module.ts` imports:
```typescript
import { ScheduleModule } from '@nestjs/schedule';
```

Add `ScheduleModule.forRoot()` to the `imports` array.

- [ ] **Step 5: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/auth/entities/webauthn-challenge.entity.ts src/auth/webauthn.service.ts src/auth/auth.module.ts src/app.module.ts package.json package-lock.json
git commit -m "security(#8): move WebAuthn challenges to database with 5-minute TTL and hourly cleanup"
```

---

### Task 10: Implement refresh token rotation with theft detection

**Files:**
- Modify: `src/users/entities/user.entity.ts` — add `refreshTokenHash` column
- Modify: `src/auth/auth.module.ts` — update AuthService.refresh and issueTokenPair

- [ ] **Step 1: Add refreshTokenHash to User entity**

In `src/users/entities/user.entity.ts`, add after the `faceDescriptor` column (line 36):

```typescript
    @Column({ type: 'text', nullable: true })
    refreshTokenHash!: string | null;
```

- [ ] **Step 2: Update AuthService to hash and store refresh tokens**

In `src/auth/auth.module.ts`, add crypto import at the top:
```typescript
import { createHash } from 'crypto';
```

Add a helper method to `AuthService`:
```typescript
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
```

Update `issueTokenPair` to store the refresh token hash:
```typescript
  async issueTokenPair(user: Omit<User, 'password'>): Promise<{ access_token: string; refresh_token: string }> {
    const secret = this.configService.get<string>('JWT_SECRET')!;
    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload, { secret, expiresIn: '15m' });
    const refresh_token = this.jwtService.sign({ sub: user.id }, { secret, expiresIn: '7d' });

    // Store hash of the new refresh token
    await this.userRepository.update(user.id, {
      refreshTokenHash: this.hashToken(refresh_token),
    });

    return { access_token, refresh_token };
  }
```

Note: `issueTokenPair` is now `async`. All callers must `await` it.

Update `login` to use the new async `issueTokenPair`:
```typescript
  async login(
    loginDto: LoginDto,
    ip: string,
  ): Promise<{
    user: Omit<User, 'password'>;
    access_token: string;
    refresh_token: string;
  }> {
    await this.verifyRecaptcha(loginDto.recaptchaToken);

    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      console.warn(`[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`);
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`);
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Debes confirmar tu correo antes de iniciar sesion. Revisa tu bandeja de entrada.'
      );
    }

    const { password, ...userResult } = user;
    const tokens = await this.issueTokenPair(userResult as Omit<User, 'password'>);
    return { user: userResult as Omit<User, 'password'>, ...tokens };
  }
```

Update `refresh` to rotate and detect theft:
```typescript
  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const secret = this.configService.get<string>('JWT_SECRET')!;
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Verify the refresh token matches what we stored
    const incomingHash = this.hashToken(refreshToken);
    if (user.refreshTokenHash !== incomingHash) {
      // Possible token theft: someone reused an old token
      // Invalidate all sessions for this user
      await this.userRepository.update(user.id, { refreshTokenHash: null });
      console.warn(`[Auth] Posible robo de refresh token — userId: ${user.id}`);
      throw new UnauthorizedException('Sesion invalida. Inicia sesion de nuevo.');
    }

    // Rotate: issue new pair and invalidate old
    const { password, ...userResult } = user;
    return this.issueTokenPair(userResult as Omit<User, 'password'>);
  }
```

- [ ] **Step 3: Update AuthController to handle the new refresh response (now returns refresh_token too)**

Update the refresh endpoint in `AuthController`:
```typescript
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No hay refresh token');
    }

    const result = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, result.refresh_token);
    return { access_token: result.access_token };
  }
```

Update all controller methods that call `issueTokenPair` to `await` it:
- `webauthnLoginVerify`: `const tokens = await this.authService.issueTokenPair(userResult);`
- `loginWithFace`: `const tokens = await this.authService.issueTokenPair(user);`
- `loginFaceOnly`: `const tokens = await this.authService.issueTokenPair(user);`

Update logout to also clear the stored hash:
```typescript
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });

    // Invalidate stored refresh token if user is authenticated
    try {
      const cookies = req.cookies as Record<string, string>;
      const token = cookies?.['refresh_token'];
      if (token) {
        const secret = this.authService['configService'].get<string>('JWT_SECRET')!;
        const payload = this.authService['jwtService'].verify(token, { secret });
        await this.authService['userRepository'].update(payload.sub, { refreshTokenHash: null });
      }
    } catch {
      // Token already expired or invalid — ignore
    }

    return { message: 'Sesion cerrada' };
  }
```

- [ ] **Step 4: Update frontend interceptor to also set the new refresh cookie**

The refresh response now returns `access_token` in the body and the new `refresh_token` as a cookie (set by `setRefreshCookie` on backend). The frontend interceptor already handles this correctly since it reads `access_token` from the response body. No frontend change needed.

- [ ] **Step 5: Verify both compile**

Run:
```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/users/entities/user.entity.ts src/auth/auth.module.ts
git commit -m "security(#10): implement refresh token rotation with theft detection"
```

---

### Task 11: Require email for face-only login

**Files:**
- Modify: `src/auth/dto/auth.dto.ts` — add email to FaceOnlyLoginDto
- Modify: `src/auth/auth.module.ts` — pass email to findUserByFace
- Modify: `frontend/src/app/services/biometric-auth.service.ts` — send email
- Modify: `frontend/src/app/pages/auth/login/login.component.ts` — pass email
- Modify: `frontend/src/app/pages/auth/login/login.component.html` — show email field hint

- [ ] **Step 1: Update FaceOnlyLoginDto to require email**

In `src/auth/dto/auth.dto.ts`, replace the `FaceOnlyLoginDto` (lines 82-86):

```typescript
export class FaceOnlyLoginDto {
  @IsEmail({}, { message: 'Email invalido' })
  email!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor!: number[];
}
```

- [ ] **Step 2: Update loginFaceOnly in AuthController to pass email**

In `src/auth/auth.module.ts`, update the `loginFaceOnly` method:

```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login/face-only')
  async loginFaceOnly(
    @Body() body: FaceOnlyLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.faceService.findUserByFace(body.faceDescriptor, body.email);
    const tokens = await this.authService.issueTokenPair(user);
    this.setRefreshCookie(res, tokens.refresh_token);
    return { user, access_token: tokens.access_token };
  }
```

- [ ] **Step 3: Update frontend loginWithFaceOnly to accept and send email**

In `frontend/src/app/services/biometric-auth.service.ts`, update `loginWithFaceOnly`:

```typescript
  async loginWithFaceOnly(email: string): Promise<any> {
    const faceDescriptor = await this.captureDescriptor();
    if (!faceDescriptor) {
      throw new Error('No se detecto tu rostro. Mejora la iluminacion e intentalo de nuevo.');
    }
    const result = await firstValueFrom(
      this.http.post<{ user: any; access_token: string }>(
        `${this.API}/login/face-only`,
        { email, faceDescriptor },
        { withCredentials: true },
      ),
    );
    this.authService.setAccessToken(result.access_token);
    return result;
  }
```

- [ ] **Step 4: Update login component to pass email from form**

In `frontend/src/app/pages/auth/login/login.component.ts`, update `loginWithFace()`:

```typescript
  async loginWithFace(): Promise<void> {
    if (this.isBlocked) return;

    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.error = 'Ingresa tu correo electronico antes de verificar tu rostro.';
      return;
    }

    this.loading = true;
    this.error   = '';
    try {
      const r = await this.biometric.loginWithFaceOnly(email);
      this.biometric.stopCamera();
      this.redirect(r);
    } catch (e: any) {
      this.handleError(e);
      this.loading = false;
    }
  }
```

- [ ] **Step 5: Update login.component.html face hint text**

In `frontend/src/app/pages/auth/login/login.component.html`, replace the `face-hint` paragraph (lines 67-70):

```html
      <p class="face-hint">
        Ingresa tu <strong>correo electronico</strong> arriba, mira de frente a la camara y pulsa <strong>Verificar</strong>.<br>
        <small>Asegurate de tener buena iluminacion y que tu rostro este registrado en tu perfil.</small>
      </p>
```

- [ ] **Step 6: Verify both compile**

Run:
```bash
npx tsc --noEmit
cd frontend && npx ng build --configuration=development 2>&1 | head -20
```

- [ ] **Step 7: Commit**

```bash
git add src/auth/dto/auth.dto.ts src/auth/auth.module.ts frontend/src/app/services/biometric-auth.service.ts frontend/src/app/pages/auth/login/login.component.ts frontend/src/app/pages/auth/login/login.component.html
git commit -m "security(#7): require email for face-only login, reducing scan from O(n) to O(1)"
```

---

### Task 12: Limit SSE connections and filter events

**Files:**
- Modify: `src/events/events.controller.ts`
- Modify: `src/events/events.service.ts`

- [ ] **Step 1: Add connection tracking to EventsService**

Replace entire `src/events/events.service.ts`:

```typescript
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface AppEvent {
  type: string;
  data?: any;
}

@Injectable()
export class EventsService {
  private subject = new Subject<AppEvent>();
  private _connections = 0;
  private readonly MAX_CONNECTIONS = 100;

  get connections(): number {
    return this._connections;
  }

  acquireConnection(): void {
    if (this._connections >= this.MAX_CONNECTIONS) {
      throw new ServiceUnavailableException('Demasiadas conexiones SSE');
    }
    this._connections++;
  }

  releaseConnection(): void {
    this._connections = Math.max(0, this._connections - 1);
  }

  emit(type: string, data?: any) {
    // Only emit minimal, non-sensitive event data
    this.subject.next({ type, data: { timestamp: new Date().toISOString() } });
  }

  getStream(): Observable<AppEvent> {
    return this.subject.asObservable();
  }
}
```

- [ ] **Step 2: Update EventsController to track connections**

Replace entire `src/events/events.controller.ts`:

```typescript
import { Controller, Sse, MessageEvent, Header, Res } from '@nestjs/common';
import { Observable, map, finalize } from 'rxjs';
import { Response } from 'express';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('stream')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Accel-Buffering', 'no')
  stream(@Res() res: Response): Observable<MessageEvent> {
    this.eventsService.acquireConnection();
    res.on('close', () => this.eventsService.releaseConnection());

    return this.eventsService.getStream().pipe(
      map(event => ({
        type: event.type,
        data: JSON.stringify(event.data ?? {}),
      })),
      finalize(() => this.eventsService.releaseConnection()),
    );
  }
}
```

- [ ] **Step 3: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/events/events.controller.ts src/events/events.service.ts
git commit -m "security(#13): limit SSE to 100 connections, strip sensitive event data"
```

---

## PHASE 4 — Improvements (Tasks 13-14)

### Task 13: Account lockout after failed login attempts

**Files:**
- Modify: `src/users/entities/user.entity.ts` — add loginAttempts, lockedUntil
- Modify: `src/auth/auth.module.ts` — add lockout logic to login

- [ ] **Step 1: Add lockout columns to User entity**

In `src/users/entities/user.entity.ts`, add after `refreshTokenHash`:

```typescript
    @Column({ default: 0 })
    failedLoginAttempts!: number;

    @Column({ type: 'timestamp', nullable: true })
    lockedUntil!: Date | null;
```

- [ ] **Step 2: Add lockout logic to AuthService.login**

In `AuthService.login`, add at the beginning (after recaptcha verification):

```typescript
    // Check account lockout
    const userForLockCheck = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });
    if (userForLockCheck?.lockedUntil && userForLockCheck.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((userForLockCheck.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ${minutesLeft} minutos.`
      );
    }
```

After a failed password check (`if (!isMatch)`), replace the existing warn + throw with:

```typescript
    if (!isMatch) {
      console.warn(`[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`);
      // Increment failed attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: Partial<User> = { failedLoginAttempts: attempts } as Partial<User>;
      if (attempts >= 5) {
        // Lock for 15 minutes
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        console.warn(`[Auth] Cuenta bloqueada — email: ${loginDto.email} — intentos: ${attempts}`);
      }
      await this.userRepository.update(user.id, updateData);
      throw new UnauthorizedException('Credenciales invalidas');
    }
```

After a successful login (after the `isEmailVerified` check), add:

```typescript
    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userRepository.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    }
```

- [ ] **Step 3: Verify the backend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/users/entities/user.entity.ts src/auth/auth.module.ts
git commit -m "security(#15): add account lockout after 5 failed login attempts (15-minute lock)"
```

---

### Task 14: Note on reCAPTCHA (#14) — deferred

Per user's decision, reCAPTCHA improvements will be handled incrementally as Firefox compatibility is investigated. No code changes in this plan.

---

## Self-Review Checklist

1. **Spec coverage:** All 15 issues addressed (14 with code, #1 manual rotation, #14 deferred).
2. **Placeholder scan:** No TBDs or TODOs — all steps have complete code.
3. **Type consistency:** `issueTokenPair` is `async` in Task 10 — all callers updated to `await`. `FaceOnlyLoginDto` adds `email` — frontend updated to send it. `findUserByFace` accepts optional `email` — signature matches Task 7.
4. **Import consistency:** All new imports (`ConfigService`, `createHash`, `WebAuthnChallenge`, etc.) are listed in their respective steps.
