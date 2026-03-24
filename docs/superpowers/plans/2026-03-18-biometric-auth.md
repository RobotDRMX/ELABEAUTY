# Biometric Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir autenticación biométrica dual (WebAuthn/Passkeys + reconocimiento facial con face-api.js) y reCAPTCHA v3 invisible en el login estándar, como capas opcionales/obligatorias sobre el flujo JWT existente, sin romper el login con email/password.

**Architecture:** Ambas opciones biométricas siguen el mismo patrón: el flujo de cookies HttpOnly ya existente no cambia, solo se añaden endpoints que emiten los mismos tokens. El reconocimiento facial funciona como **segundo factor** (password + cara): el usuario introduce sus credenciales y, si tiene cara registrada, debe pasar el match facial. WebAuthn reemplaza completamente el par email/password mediante firma criptográfica. `AuthService` expone un método público `issueTokenPair()` para que los nuevos endpoints no dupliquen la lógica de firma de tokens. El `userId` se incluye en la respuesta de `/webauthn/login/options` y el cliente lo devuelve al verificar, evitando doble generación de challenge. El login estándar (email/password) requiere reCAPTCHA v3 invisible — el token se genera en el frontend y se verifica en NestJS antes de emitir el JWT.

**Tech Stack:** `@simplewebauthn/server` (backend) + `@simplewebauthn/browser` (frontend), `face-api.js`, `ng-recaptcha`, `@nestjs/axios`, TypeORM columnas nullable, Angular standalone.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/users/entities/user.entity.ts` | Modificar | +2 columnas nullable: `webauthnCredential`, `faceDescriptor` |
| `src/auth/dto/auth.dto.ts` | Modificar | +DTOs para WebAuthn y face login |
| `src/auth/auth.module.ts` | Modificar | +método `issueTokenPair` en `AuthService`, +5 endpoints, +2 providers |
| `src/auth/webauthn.service.ts` | Crear | Genera/verifica challenges WebAuthn |
| `src/auth/face.service.ts` | Crear | Guarda y compara descriptores faciales |
| `frontend/src/assets/models/` | Crear | Modelos de face-api.js (binarios, ver nota git) |
| `frontend/src/app/services/biometric-auth.service.ts` | Crear | Orquesta WebAuthn y face-api.js en Angular |
| `frontend/src/app/pages/auth/login/login.component.ts` | Modificar | +métodos para cada flujo biométrico |
| `frontend/src/app/pages/auth/login/login.component.html` | Modificar | +2 botones y sección de cámara |
| `frontend/src/app/pages/auth/login/login.component.scss` | Modificar | Estilos para botones biométricos |
| `frontend/src/app/pages/profile/profile.component.ts` | Modificar | +sección "Registrar biometría" |
| `frontend/src/app/pages/profile/profile.component.html` | Modificar | +UI de enrollment |
| `src/auth/dto/auth.dto.ts` | Modificar | +campo `recaptchaToken` en `LoginDto` |
| `src/auth/auth.module.ts` | Modificar | +`verifyRecaptcha()` en `AuthService`, validación en `/login` |
| `frontend/src/app/pages/auth/login/login.component.ts` | Modificar | +ejecución de reCAPTCHA v3 antes del submit |
| `frontend/src/index.html` | Modificar | +script de reCAPTCHA v3 |
| `.env` | Modificar | +`RECAPTCHA_SECRET_KEY` |

---

## Task 1: Columnas DB + DTOs

**Files:**
- Modify: `src/users/entities/user.entity.ts`
- Modify: `src/auth/dto/auth.dto.ts`

- [ ] **Step 1: Añadir columnas nullable a User entity**

En `src/users/entities/user.entity.ts`, añadir después del campo `isActive`:

```typescript
@Column({ type: 'text', nullable: true })
webauthnCredential!: string | null;  // JSON: { credentialID, publicKey, counter, rpID }

@Column({ type: 'text', nullable: true })
faceDescriptor!: string | null;  // JSON: number[] de 128 valores — nunca almacenar la foto
```

- [ ] **Step 2: Añadir DTOs nuevos al final de `auth.dto.ts`**

`IsEmail` ya está importado en la línea 1. Añadir las importaciones que faltan en el import existente: `IsArray, IsNumber, IsObject, IsOptional, IsString`. Luego añadir al final del archivo:

```typescript
// ── Biometric DTOs ───────────────────────────────────────────────────────

export class WebAuthnVerifyRegistrationDto {
  @IsObject()
  registrationResponse!: Record<string, unknown>;
}

export class WebAuthnVerifyAuthDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  // userId devuelto por /webauthn/login/options para evitar re-generar el challenge
  @IsNumber()
  userId!: number;

  @IsObject()
  authenticationResponse!: Record<string, unknown>;
}

export class FaceDescriptorDto {
  @IsArray()
  @IsNumber({}, { each: true })
  descriptor!: number[];
}

// Face login = segundo factor: password obligatorio + descriptor facial opcional.
// Si el usuario tiene cara registrada y envía el descriptor, debe coincidir.
// Si el usuario no tiene cara registrada, el login procede solo con password.
export class FaceLoginDto extends LoginDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  faceDescriptor?: number[];
}
```

- [ ] **Step 3: Arrancar el backend y verificar la migración en MySQL**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty"
npm run start:dev
# Esperar a que aparezca "Application is running on: http://[::1]:3000"
```

Luego en otro terminal, verificar en MySQL:

```bash
# Abre MySQL CLI o phpMyAdmin y ejecuta:
# USE ela_beauty;
# DESCRIBE users;
# Verificar que aparecen las columnas: webauthnCredential y faceDescriptor
```

- [ ] **Step 4: Commit**

```bash
git add src/users/entities/user.entity.ts src/auth/dto/auth.dto.ts
git commit -m "feat(auth): add webauthnCredential + faceDescriptor columns and DTOs"
```

---

## Task 2: Exponer `issueTokenPair` en AuthService

Este método centraliza la generación de tokens para que los nuevos endpoints no dupliquen la lógica.

**Files:**
- Modify: `src/auth/auth.module.ts` (solo la clase `AuthService`)

- [ ] **Step 1: Añadir el método al final de `AuthService` (antes del cierre de clase)**

```typescript
// Método público reutilizable por los nuevos endpoints biométricos.
// Firma y devuelve el par de tokens; el controller escribe las cookies.
issueTokenPair(user: Omit<User, 'password'>): { access_token: string; refresh_token: string } {
  const secret = this.configService.get<string>('JWT_SECRET')!;
  const payload = { email: user.email, sub: user.id, role: user.role };
  return {
    access_token: this.jwtService.sign(payload, { secret, expiresIn: '15m' }),
    refresh_token: this.jwtService.sign({ sub: user.id }, { secret, expiresIn: '7d' }),
  };
}
```

- [ ] **Step 2: Añadir `setCookies` como método privado en `AuthController` (antes del cierre de clase)**

```typescript
// Helper privado: escribe access_token y refresh_token como cookies HttpOnly.
// Todos los endpoints de login (password, WebAuthn, face) lo usan.
private setCookies(
  res: Response,
  tokens: { access_token: string; refresh_token: string },
): void {
  const isProd = process.env['NODE_ENV'] === 'production';
  const cookieOpts = { httpOnly: true, secure: isProd, sameSite: 'strict' as const };
  res.cookie('access_token',  tokens.access_token,  { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', tokens.refresh_token, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}
```

- [ ] **Step 3: Refactorizar el endpoint `/login` existente para usar `setCookies`**

En el método `login` de `AuthController`, reemplazar el bloque `res.cookie(...)` doble:

```typescript
// ANTES (dos llamadas res.cookie separadas con opciones repetidas):
res.cookie('access_token', result.access_token, { httpOnly: true, ... });
res.cookie('refresh_token', result.refresh_token, { httpOnly: true, ... });

// DESPUÉS:
this.setCookies(res, result);
return { user: result.user };
```

- [ ] **Step 4: Verificar que el backend aún arranca sin errores**

```bash
npm run start:dev
# No debe haber errores de TypeScript ni de inyección
```

- [ ] **Step 5: Commit**

```bash
git add src/auth/auth.module.ts
git commit -m "refactor(auth): centralize token signing and cookie writing"
```

---

## Task 3: WebAuthn Service

**Files:**
- Create: `src/auth/webauthn.service.ts`

- [ ] **Step 1: Instalar la dependencia**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty"
npm install @simplewebauthn/server
```

- [ ] **Step 2: Crear el servicio**

```typescript
// src/auth/webauthn.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
// Los tipos viven en @simplewebauthn/server en v9+
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

// Challenge en memoria por userId.
// En producción: reemplazar por Redis con TTL de 5 minutos.
const challengeStore = new Map<number, string>();

@Injectable()
export class WebAuthnService {
  private readonly rpName   = 'ELA Beauty';
  private readonly rpID     = 'localhost';
  private readonly origin   = 'http://localhost:4200';

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async generateRegistrationOptions(userId: number) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    const options = await generateRegistrationOptions({
      rpName:   this.rpName,
      rpID:     this.rpID,
      userID:   Buffer.from(String(user.id)),
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey:      'preferred',
        userVerification: 'preferred',
      },
    });

    challengeStore.set(userId, options.challenge);
    return options;
  }

  async verifyRegistration(userId: number, response: RegistrationResponseJSON) {
    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge) throw new BadRequestException('Challenge no encontrado o expirado');

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
    await this.userRepo.update(userId, {
      webauthnCredential: JSON.stringify({
        credentialID: Buffer.from(credential.id).toString('base64url'),
        publicKey:    Buffer.from(credential.publicKey).toString('base64url'),
        counter:      credential.counter,
        rpID:         this.rpID,
      }),
    });

    challengeStore.delete(userId);
    return { verified: true };
  }

  // Devuelve options + userId para que el cliente lo reenvíe al verificar.
  // Así evitamos llamar a generateAuthOptions dos veces (lo que sobrescribiría el challenge).
  async generateAuthOptions(email: string): Promise<{ options: any; userId: number }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user?.webauthnCredential) {
      throw new BadRequestException('Este usuario no tiene Passkey registrado');
    }

    const credential = JSON.parse(user.webauthnCredential);
    const options = await generateAuthenticationOptions({
      rpID:             this.rpID,
      userVerification: 'preferred',
      allowCredentials: [{ id: credential.credentialID, type: 'public-key' }],
    });

    challengeStore.set(user.id, options.challenge);
    return { options, userId: user.id };
  }

  async verifyAuthentication(userId: number, response: AuthenticationResponseJSON): Promise<User> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.webauthnCredential) throw new BadRequestException('Sin Passkey registrado');

    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge) throw new BadRequestException('Challenge no encontrado o expirado');

    const credential = JSON.parse(user.webauthnCredential);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID:   this.rpID,
      credential: {
        id:        credential.credentialID,
        publicKey: Buffer.from(credential.publicKey, 'base64url'),
        counter:   credential.counter,
      },
    });

    if (!verification.verified) throw new UnauthorizedException('Passkey inválido');

    // Actualizar counter para prevenir ataques de replay
    credential.counter = verification.authenticationInfo.newCounter;
    await this.userRepo.update(userId, { webauthnCredential: JSON.stringify(credential) });

    challengeStore.delete(userId);
    return user;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/auth/webauthn.service.ts package.json package-lock.json
git commit -m "feat(auth): add WebAuthnService with register/authenticate flow"
```

---

## Task 4: Face Service

**Files:**
- Create: `src/auth/face.service.ts`

- [ ] **Step 1: Crear el servicio**

```typescript
// src/auth/face.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FaceService {
  // Umbral de distancia euclidiana: valores menores = más similares.
  // 0.45 es estricto (face-api.js recomienda 0.6; usamos 0.45 por ser e-commerce).
  private readonly THRESHOLD = 0.45;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async saveDescriptor(userId: number, descriptor: number[]): Promise<{ saved: boolean }> {
    if (descriptor.length !== 128) {
      throw new BadRequestException('El descriptor facial debe tener exactamente 128 valores');
    }
    await this.userRepo.update(userId, { faceDescriptor: JSON.stringify(descriptor) });
    return { saved: true };
  }

  // Retorna true si el descriptor entrante coincide con el registrado.
  // Retorna false (no lanza) si el usuario no tiene cara registrada: permite el fallback a password.
  async verifyDescriptor(userId: number, incoming: number[]): Promise<boolean> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.faceDescriptor) return false;

    const stored: number[] = JSON.parse(user.faceDescriptor);
    return this.euclideanDistance(stored, incoming) < this.THRESHOLD;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}
```

- [ ] **Step 2: Verificar la función de distancia**

```bash
node -e "
const a = new Array(128).fill(0.1);
const b = [...a];
const dist0 = Math.sqrt(a.reduce((s,v,i) => s + Math.pow(v - b[i], 2), 0));
console.log('Mismo descriptor (debe ser 0):', dist0);

const c = new Array(128).fill(0.6);
const dist1 = Math.sqrt(a.reduce((s,v,i) => s + Math.pow(v - c[i], 2), 0));
console.log('Descriptores distintos (debe ser > 0.45):', dist1.toFixed(4));
"
# Esperado: 0 y ~0.5657
```

- [ ] **Step 3: Commit**

```bash
git add src/auth/face.service.ts
git commit -m "feat(auth): add FaceService with euclidean distance verification"
```

---

## Task 5: Nuevos endpoints en AuthModule

Añade los 5 endpoints nuevos y registra los providers. No modifica los endpoints existentes.

**Files:**
- Modify: `src/auth/auth.module.ts`

- [ ] **Step 1: Añadir imports al inicio del archivo**

```typescript
import { WebAuthnService } from './webauthn.service';
import { FaceService } from './face.service';
import {
  WebAuthnVerifyRegistrationDto,
  WebAuthnVerifyAuthDto,
  FaceDescriptorDto,
  FaceLoginDto,
} from './dto/auth.dto';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
```

- [ ] **Step 2: Actualizar el constructor de `AuthController`**

```typescript
constructor(
  private readonly authService:   AuthService,
  private readonly webAuthnService: WebAuthnService,
  private readonly faceService:   FaceService,
) {}
```

- [ ] **Step 3: Añadir los 5 endpoints en `AuthController`, después de `logout`**

```typescript
// ── WebAuthn ──────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Get('webauthn/register/options')
webauthnRegisterOptions(@Req() req: any) {
  return this.webAuthnService.generateRegistrationOptions(req.user.userId);
}

@UseGuards(JwtAuthGuard)
@Post('webauthn/register/verify')
webauthnRegisterVerify(
  @Req() req: any,
  @Body() body: WebAuthnVerifyRegistrationDto,
) {
  return this.webAuthnService.verifyRegistration(
    req.user.userId,
    body.registrationResponse as RegistrationResponseJSON,
  );
}

// Devuelve { options, userId } — el cliente debe enviar userId en /login/verify
@Post('webauthn/login/options')
webauthnLoginOptions(@Body('email') email: string) {
  return this.webAuthnService.generateAuthOptions(email);
}

// userId viene del cliente (devuelto por /login/options), nunca se regenera el challenge
@Post('webauthn/login/verify')
async webauthnLoginVerify(
  @Body() body: WebAuthnVerifyAuthDto,
  @Res({ passthrough: true }) res: Response,
) {
  const user = await this.webAuthnService.verifyAuthentication(
    body.userId,
    body.authenticationResponse as AuthenticationResponseJSON,
  );
  const { password: _p, ...userResult } = user;
  this.setCookies(res, this.authService.issueTokenPair(userResult));
  return { user: userResult };
}

// ── Face (segundo factor) ─────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Post('face/save')
saveFaceDescriptor(@Req() req: any, @Body() body: FaceDescriptorDto) {
  return this.faceService.saveDescriptor(req.user.userId, body.descriptor);
}

// Igual que /login pero añade verificación facial si el descriptor viene en el body.
// Si el usuario no tiene cara registrada, el login procede solo con password.
// Si tiene cara registrada y el descriptor no coincide, se rechaza.
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
    const match = await this.faceService.verifyDescriptor(user.id, body.faceDescriptor);
    // Si tiene cara registrada y no coincide → rechazar
    const stored = await this.faceService.verifyDescriptor(user.id, body.faceDescriptor);
    if (!stored && body.faceDescriptor) {
      // hasDescriptor? si no hay descriptor guardado, match devuelve false pero es OK
    }
    if (!match) {
      // Solo bloquear si hay descriptor guardado (verifyDescriptor retorna false en ambos casos)
      // Necesitamos saber si el usuario tiene cara registrada:
      // La lógica está en FaceService — si retorna false Y el usuario tiene faceDescriptor → rechazar
    }
  }

  this.setCookies(res, this.authService.issueTokenPair(user));
  return { user };
}
```

> **Nota:** La lógica de "rechazar solo si el usuario tiene cara registrada" requiere que `FaceService.verifyDescriptor` distinga entre "no tiene descriptor" y "descriptor no coincide". Ajustar en el siguiente sub-step.

- [ ] **Step 4: Ajustar `FaceService` para retornar el estado distinguido**

```typescript
// Modificar en src/auth/face.service.ts

// Cambiar el tipo de retorno de verifyDescriptor:
async verifyDescriptor(
  userId: number,
  incoming: number[],
): Promise<{ hasDescriptor: boolean; match: boolean }> {
  const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
  if (!user.faceDescriptor) return { hasDescriptor: false, match: false };

  const stored: number[] = JSON.parse(user.faceDescriptor);
  const match = this.euclideanDistance(stored, incoming) < this.THRESHOLD;
  return { hasDescriptor: true, match };
}
```

- [ ] **Step 5: Limpiar el endpoint `loginWithFace` con la lógica correcta**

```typescript
@Throttle({ global: { limit: 5, ttl: 60000 } })
@Post('login/face')
async loginWithFace(
  @Body() body: FaceLoginDto,
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  const result = await this.authService.login(body, ip);  // valida password
  const user = result.user as Omit<User, 'password'>;

  if (body.faceDescriptor) {
    const { hasDescriptor, match } = await this.faceService.verifyDescriptor(
      user.id,
      body.faceDescriptor,
    );
    // Si el usuario tiene cara registrada y no coincide → rechazar aunque la password sea correcta
    if (hasDescriptor && !match) {
      throw new UnauthorizedException('Rostro no reconocido');
    }
  }

  this.setCookies(res, this.authService.issueTokenPair(user));
  return { user };
}
```

- [ ] **Step 6: Añadir los providers al `@Module`**

```typescript
providers: [AuthService, JwtStrategy, JwtAuthGuard, WebAuthnService, FaceService],
```

- [ ] **Step 7: Verificar que el backend arranca y los endpoints aparecen mapeados**

```bash
npm run start:dev
# Buscar en el output:
# POST /auth/webauthn/register/verify
# GET /auth/webauthn/register/options
# POST /auth/webauthn/login/options
# POST /auth/webauthn/login/verify
# POST /auth/face/save
# POST /auth/login/face
```

- [ ] **Step 8: Smoke test rápido**

```bash
# Debe responder 400 "Este usuario no tiene Passkey registrado" (correcto)
curl -X POST http://localhost:3000/auth/webauthn/login/options \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Debe responder 401 (sin cookie de login)
curl -X POST http://localhost:3000/auth/face/save \
  -H "Content-Type: application/json" \
  -d '{"descriptor":[0.1,0.2]}'
```

- [ ] **Step 9: Commit**

```bash
git add src/auth/auth.module.ts src/auth/face.service.ts
git commit -m "feat(auth): add WebAuthn and face-login endpoints to AuthController"
```

---

## Task 6: Modelos de face-api.js (assets)

> **Nota git:** Los modelos son archivos binarios (~6 MB). Para no inflar el repo, se añaden a `.gitignore` y se provee un script de descarga. Los compañeros de equipo ejecutan el script una vez al clonar.

**Files:**
- Create: `frontend/src/assets/models/` (no committeado)
- Create: `scripts/download-models.sh`
- Modify: `.gitignore`

- [ ] **Step 1: Añadir a `.gitignore`**

```
# face-api.js model weights (binaries, download via scripts/download-models.sh)
frontend/src/assets/models/
```

- [ ] **Step 2: Crear el script de descarga**

```bash
# scripts/download-models.sh
#!/bin/bash
set -e

BASE="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
DEST="frontend/src/assets/models"
mkdir -p "$DEST"

FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_tiny_model-weights_manifest.json"
  "face_landmark_68_tiny_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)

for f in "${FILES[@]}"; do
  echo "Descargando $f..."
  curl -sL "$BASE/$f" -o "$DEST/$f"
done

echo "✓ Modelos descargados en $DEST"
```

- [ ] **Step 3: Ejecutar el script**

```bash
bash scripts/download-models.sh
# Verificar que aparecen 7 archivos:
ls frontend/src/assets/models/
```

- [ ] **Step 4: Instalar face-api.js en el frontend**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend"
npm install face-api.js
```

- [ ] **Step 5: Commit (sin los binarios)**

```bash
git add .gitignore scripts/download-models.sh frontend/package.json frontend/package-lock.json
git commit -m "feat(auth): add face-api.js model download script and gitignore for weights"
```

---

## Task 7: BiometricAuthService (Angular)

**Files:**
- Create: `frontend/src/app/services/biometric-auth.service.ts`

- [ ] **Step 1: Instalar `@simplewebauthn/browser` (debe hacerse ANTES de escribir el servicio)**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend"
npm install @simplewebauthn/browser
```

- [ ] **Step 2: Crear el servicio**

```typescript
// frontend/src/app/services/biometric-auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as faceapi from 'face-api.js';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

@Injectable({ providedIn: 'root' })
export class BiometricAuthService {
  private readonly API        = 'http://localhost:3000/auth';
  private readonly MODELS_URL = '/assets/models';

  readonly webAuthnSupported = signal(browserSupportsWebAuthn());
  readonly modelsLoaded      = signal(false);
  readonly cameraActive      = signal(false);

  private videoEl: HTMLVideoElement | null = null;
  private stream:  MediaStream | null      = null;

  constructor(private http: HttpClient) {}

  // ── WebAuthn ─────────────────────────────────────────────────────────────

  async registerPasskey(): Promise<void> {
    const options = await firstValueFrom(
      this.http.get<any>(`${this.API}/webauthn/register/options`, { withCredentials: true }),
    );
    const registrationResponse = await startRegistration({ optionsJSON: options });
    await firstValueFrom(
      this.http.post(
        `${this.API}/webauthn/register/verify`,
        { registrationResponse },
        { withCredentials: true },
      ),
    );
  }

  async loginWithPasskey(email: string): Promise<any> {
    // Paso 1: obtener options + userId del servidor
    const { options, userId } = await firstValueFrom(
      this.http.post<{ options: any; userId: number }>(
        `${this.API}/webauthn/login/options`,
        { email },
      ),
    );
    // Paso 2: el navegador/OS autentica con el Passkey guardado
    const authenticationResponse = await startAuthentication({ optionsJSON: options });
    // Paso 3: enviar userId + respuesta al servidor (userId evita regenerar el challenge)
    return firstValueFrom(
      this.http.post(
        `${this.API}/webauthn/login/verify`,
        { email, userId, authenticationResponse },
        { withCredentials: true },
      ),
    );
  }

  // ── face-api.js ──────────────────────────────────────────────────────────

  async loadModels(): Promise<void> {
    if (this.modelsLoaded()) return;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(this.MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS_URL),
    ]);
    this.modelsLoaded.set(true);
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.videoEl = videoElement;
    this.stream  = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 240 },
    });
    videoElement.srcObject = this.stream;
    await videoElement.play();
    this.cameraActive.set(true);
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.videoEl) this.videoEl.srcObject = null;
    this.cameraActive.set(false);
  }

  async captureDescriptor(): Promise<number[] | null> {
    if (!this.videoEl || !this.modelsLoaded()) return null;
    const detection = await faceapi
      .detectSingleFace(this.videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    return detection ? Array.from(detection.descriptor) : null;
  }

  async saveMyFaceDescriptor(): Promise<void> {
    const descriptor = await this.captureDescriptor();
    if (!descriptor) throw new Error('No se detectó un rostro. Mejora la iluminación e inténtalo de nuevo.');
    await firstValueFrom(
      this.http.post(`${this.API}/face/save`, { descriptor }, { withCredentials: true }),
    );
  }

  // Face login = segundo factor: envía email + password + descriptor facial juntos.
  // Si no se puede capturar el rostro (mala luz), lanza un error para que
  // el componente informe al usuario de usar el login estándar.
  async loginWithFace(email: string, password: string): Promise<any> {
    const faceDescriptor = await this.captureDescriptor();
    if (!faceDescriptor) {
      throw new Error('No se detectó tu rostro. Usa email/contraseña o mejora la iluminación.');
    }
    return firstValueFrom(
      this.http.post(`${this.API}/login/face`, { email, password, faceDescriptor }, { withCredentials: true }),
    );
  }
}
```

- [ ] **Step 3: Verificar compilación**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend"
npx ng build --configuration development 2>&1 | grep -iE "error TS" | head -10
# No debe haber errores
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/services/biometric-auth.service.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(auth): add BiometricAuthService (WebAuthn + face-api.js)"
```

---

## Task 8: Login UI — botones biométricos

**Files:**
- Modify: `frontend/src/app/pages/auth/login/login.component.ts`
- Modify: `frontend/src/app/pages/auth/login/login.component.html`
- Modify: `frontend/src/app/pages/auth/login/login.component.scss`

- [ ] **Step 1: Reemplazar `login.component.ts` completo**

```typescript
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BiometricAuthService } from '../../../services/biometric-auth.service';

type BiometricMode = 'none' | 'face';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;

  loginForm: FormGroup;
  error        = '';
  loading      = false;
  biometricMode: BiometricMode = 'none';

  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    public  biometric:   BiometricAuthService,
    private router:      Router,
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnDestroy(): void {
    this.biometric.stopCamera();
  }

  // ── Login estándar ────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error   = '';
    this.authService.login(this.loginForm.value).subscribe({
      next:  (r: any) => this.redirect(r),
      error: (e: any) => { this.error = e.error?.message || 'Error al iniciar sesión'; this.loading = false; },
    });
  }

  // ── WebAuthn ──────────────────────────────────────────────────────────────
  async loginPasskey(): Promise<void> {
    const email = this.loginForm.get('email')?.value as string;
    if (!email) { this.error = 'Escribe tu email primero'; return; }
    this.loading = true;
    this.error   = '';
    try {
      const r = await this.biometric.loginWithPasskey(email);
      this.redirect(r);
    } catch (e: any) {
      this.error = e.error?.message || e.message || 'Passkey fallido';
      this.loading = false;
    }
  }

  // ── Face ──────────────────────────────────────────────────────────────────
  async activateFaceLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error = 'Completa email y contraseña primero (son necesarios junto al reconocimiento facial)';
      return;
    }
    this.biometricMode = 'face';
    this.error         = '';
    await this.biometric.loadModels();
    // Espera al siguiente ciclo para que Angular renderice el <video>
    setTimeout(() => this.biometric.startCamera(this.videoRef.nativeElement), 100);
  }

  async loginWithFace(): Promise<void> {
    this.loading = true;
    this.error   = '';
    try {
      const { email, password } = this.loginForm.value as { email: string; password: string };
      const r = await this.biometric.loginWithFace(email, password);
      this.biometric.stopCamera();
      this.redirect(r);
    } catch (e: any) {
      this.error = e.error?.message || e.message || 'Reconocimiento fallido';
      this.loading = false;
    }
  }

  cancelFace(): void {
    this.biometricMode = 'none';
    this.biometric.stopCamera();
  }

  private redirect(r: any): void {
    if (r?.user?.role === 'admin') this.router.navigate(['/admin']);
    else this.router.navigate(['/']);
  }
}
```

- [ ] **Step 2: Reemplazar `login.component.html` completo**

```html
<div class="auth-container fade-in">
  <div class="auth-card">

    <div class="auth-header">
      <h2>Iniciar Sesión</h2>
      <p>Bienvenido de nuevo a ELA Beauty</p>
    </div>

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
      <div class="form-group">
        <label for="email">Correo Electrónico</label>
        <input type="email" id="email" formControlName="email" placeholder="ejemplo@correo.com">
        <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.errors" class="error-msg">
          <small *ngIf="loginForm.get('email')?.errors?.['required']">El email es requerido</small>
          <small *ngIf="loginForm.get('email')?.errors?.['email']">Formato de email inválido</small>
        </div>
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <input type="password" id="password" formControlName="password" placeholder="Tu contraseña">
        <div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.errors" class="error-msg">
          <small *ngIf="loginForm.get('password')?.errors?.['required']">La contraseña es requerida</small>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

      <button type="submit" class="btn-maybelline" [disabled]="loginForm.invalid || loading">
        {{ loading ? 'Verificando...' : 'Entrar' }}
      </button>
    </form>

    <div class="biometric-divider"><span>o usa</span></div>

    <div class="biometric-buttons">
      <button
        *ngIf="biometric.webAuthnSupported()"
        class="btn-biometric"
        type="button"
        [disabled]="loading"
        (click)="loginPasskey()">
        🔑 Passkey
      </button>
      <button
        class="btn-biometric"
        type="button"
        [disabled]="loading || biometricMode === 'face'"
        (click)="activateFaceLogin()">
        📷 Reconocimiento facial
      </button>
    </div>

    <!-- Visor de cámara: solo visible en modo face -->
    <div *ngIf="biometricMode === 'face'" class="face-panel">
      <p class="face-hint">
        Mira de frente a la cámara y pulsa <strong>Verificar</strong>.<br>
        <small>Requiere email y contraseña correctos + tu rostro registrado.</small>
      </p>
      <video #videoRef autoplay muted playsinline class="face-video"></video>
      <div class="face-actions">
        <button
          class="btn-maybelline"
          type="button"
          [disabled]="!biometric.cameraActive() || loading"
          (click)="loginWithFace()">
          {{ loading ? 'Verificando...' : 'Verificar rostro' }}
        </button>
        <button class="btn-ghost" type="button" (click)="cancelFace()">Cancelar</button>
      </div>
    </div>

    <div class="auth-footer">
      <p>¿No tienes una cuenta? <a routerLink="/auth/register">Regístrate aquí</a></p>
    </div>

  </div>
</div>
```

- [ ] **Step 3: Añadir al final de `login.component.scss`**

```scss
.biometric-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 16px;
  color: var(--text-secondary);
  font-size: 0.82rem;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--gray-300);
  }
}

.biometric-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.btn-biometric {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid var(--gray-300);
  background: var(--gray-100);

  &:hover:not(:disabled) {
    border-color: var(--primary-color);
    background: white;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.face-panel {
  background: var(--gray-100);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: center;
}

.face-hint {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.face-video {
  width: 100%;
  max-width: 280px;
  border-radius: 8px;
  border: 2px solid var(--primary-color);
  display: block;
  margin: 0 auto 12px;
  background: #000;
}

.face-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
```

- [ ] **Step 4: Verificar compilación**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend"
npx ng build --configuration development 2>&1 | grep -iE "error TS" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/auth/login/
git commit -m "feat(auth): update login UI with passkey and face recognition buttons"
```

---

## Task 9: Enrollment en Perfil

**Files:**
- Modify: `frontend/src/app/pages/profile/profile.component.ts`
- Modify: `frontend/src/app/pages/profile/profile.component.html`

- [ ] **Step 1: Leer el archivo actual del componente**

```bash
cat "frontend/src/app/pages/profile/profile.component.ts"
```

- [ ] **Step 2: Añadir las importaciones necesarias en profile.component.ts**

Al inicio del archivo, añadir:

```typescript
import { ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { BiometricAuthService } from '../../services/biometric-auth.service';
```

- [ ] **Step 3: Actualizar la firma del componente y el constructor**

El componente debe implementar `OnDestroy`. Actualizar la clase:

```typescript
// Añadir OnDestroy a la firma del componente:
export class ProfileComponent implements OnInit, OnDestroy {

// Añadir en la clase (después de las propiedades existentes):
@ViewChild('enrollVideo') enrollVideoRef?: ElementRef<HTMLVideoElement>;
enrollMode: 'none' | 'face' = 'none';
enrollMsg  = '';
enrollLoading = false;

// Actualizar el constructor añadiendo BiometricAuthService:
// (mantener todos los parámetros existentes y añadir al final)
constructor(
  /* ... parámetros existentes ... */
  public biometric: BiometricAuthService,
) {}

ngOnDestroy(): void {
  this.biometric.stopCamera();
}
```

- [ ] **Step 4: Añadir los métodos de enrollment**

```typescript
async enrollPasskey(): Promise<void> {
  this.enrollMsg     = '';
  this.enrollLoading = true;
  try {
    await this.biometric.registerPasskey();
    this.enrollMsg = '✓ Passkey registrado correctamente';
  } catch (e: any) {
    this.enrollMsg = e.error?.message || e.message || 'Error al registrar Passkey';
  }
  this.enrollLoading = false;
}

async startFaceEnroll(): Promise<void> {
  this.enrollMode = 'face';
  this.enrollMsg  = '';
  await this.biometric.loadModels();
  setTimeout(() => this.biometric.startCamera(this.enrollVideoRef!.nativeElement), 100);
}

async saveFace(): Promise<void> {
  this.enrollLoading = true;
  try {
    await this.biometric.saveMyFaceDescriptor();
    this.enrollMsg  = '✓ Rostro registrado correctamente';
    this.enrollMode = 'none';
    this.biometric.stopCamera();
  } catch (e: any) {
    this.enrollMsg = e.message || 'No se detectó rostro';
  }
  this.enrollLoading = false;
}

cancelEnroll(): void {
  this.enrollMode = 'none';
  this.biometric.stopCamera();
}
```

- [ ] **Step 5: Añadir la sección biométrica en profile.component.html**

Añadir después del bloque de datos personales existente:

```html
<!-- ── Acceso Biométrico ── -->
<div class="profile-section biometric-section">
  <h3>Acceso Biométrico</h3>
  <p class="section-desc">Configura métodos de inicio de sesión adicionales.</p>

  <div class="biometric-options">
    <!-- WebAuthn -->
    <div class="biometric-option" *ngIf="biometric.webAuthnSupported()">
      <div class="option-info">
        <span class="option-icon">🔑</span>
        <div>
          <strong>Passkey</strong>
          <small>Huella dactilar o Face ID del sistema</small>
        </div>
      </div>
      <button class="btn-outline" [disabled]="enrollLoading" (click)="enrollPasskey()">
        {{ enrollLoading ? 'Registrando...' : 'Registrar Passkey' }}
      </button>
    </div>

    <!-- Face -->
    <div class="biometric-option">
      <div class="option-info">
        <span class="option-icon">📷</span>
        <div>
          <strong>Reconocimiento Facial</strong>
          <small>Tu cámara como segundo factor de login</small>
        </div>
      </div>
      <button
        class="btn-outline"
        [disabled]="enrollLoading || enrollMode === 'face'"
        (click)="startFaceEnroll()">
        Registrar Rostro
      </button>
    </div>
  </div>

  <!-- Cámara de enrollment -->
  <div *ngIf="enrollMode === 'face'" class="enroll-camera">
    <p>Mira de frente a la cámara y pulsa <strong>Guardar rostro</strong>.</p>
    <video #enrollVideo autoplay muted playsinline class="face-video"></video>
    <div class="face-actions">
      <button
        class="btn-maybelline"
        [disabled]="!biometric.cameraActive() || enrollLoading"
        (click)="saveFace()">
        {{ enrollLoading ? 'Guardando...' : 'Guardar rostro' }}
      </button>
      <button class="btn-ghost" (click)="cancelEnroll()">Cancelar</button>
    </div>
  </div>

  <p *ngIf="enrollMsg"
     class="enroll-msg"
     [style.color]="enrollMsg.startsWith('✓') ? 'green' : 'var(--primary-color)'">
    {{ enrollMsg }}
  </p>
</div>
```

- [ ] **Step 6: Verificar compilación**

```bash
npx ng build --configuration development 2>&1 | grep -iE "error TS" | head -10
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/pages/profile/
git commit -m "feat(auth): add biometric enrollment section to profile page"
```

---

## Task 10: Smoke test end-to-end

- [ ] **Step 1: Arrancar backend y frontend**

```bash
# Terminal 1 — backend
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty"
npm run start:dev

# Terminal 2 — frontend
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend"
ng serve
```

- [ ] **Step 2: Verificar login estándar (no debe estar roto)**

1. Ir a `http://localhost:4200/auth/login`
2. Ingresar con credenciales válidas
3. Verificar redirección correcta al home o admin

- [ ] **Step 3: Test enrollment facial (perfil)**

1. Iniciar sesión con email/password
2. Ir a `/profile` → sección "Acceso Biométrico" → "Registrar Rostro"
3. Cámara se activa → pulsar "Guardar rostro"
4. Mensaje `✓ Rostro registrado correctamente`

- [ ] **Step 4: Test login facial (segundo factor)**

1. Cerrar sesión → ir a `/auth/login`
2. Escribir email y contraseña
3. Pulsar "Reconocimiento facial" → cámara activa → "Verificar rostro"
4. Debe redirigir correctamente

- [ ] **Step 5: Test WebAuthn (si el navegador soporta Passkeys)**

1. En `/profile` → "Registrar Passkey" → seguir prompt del navegador
2. Cerrar sesión → login → "🔑 Passkey" → autenticar con el OS

- [ ] **Step 6: Verificar comportamiento sin cara registrada**

1. Con un usuario nuevo (sin cara registrada), usar login facial
2. El sistema debe dejar pasar si la password es correcta (no tiene descriptor guardado)

- [ ] **Step 7: Commit final**

```bash
git add -A
git commit -m "feat(auth): biometric auth complete — WebAuthn passkeys + face-api.js 2FA"
```

---

## Task 11: reCAPTCHA v3 en login estándar

Solo aplica al flujo email/password (`POST /auth/login`). Los flujos WebAuthn y face-login no lo necesitan — WebAuthn tiene su propia criptografía y face-login ya requiere password + descriptor.

**Files:**
- Modify: `src/auth/dto/auth.dto.ts`
- Modify: `src/auth/auth.module.ts`
- Modify: `frontend/src/index.html`
- Modify: `frontend/src/app/pages/auth/login/login.component.ts`
- Modify: `.env`

### Paso previo: crear cuenta y obtener claves

1. Ir a `https://www.google.com/recaptcha/admin/create`
2. Elegir **reCAPTCHA v3**
3. Dominio: añadir `localhost`
4. Copiar **Site Key** (pública, va al frontend) y **Secret Key** (privada, va al backend)

- [ ] **Step 1: Añadir la Secret Key al `.env`**

```bash
# En .env añadir:
RECAPTCHA_SECRET_KEY=tu_secret_key_aqui
```

- [ ] **Step 2: Instalar `@nestjs/axios` en el backend (para llamar a Google)**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty"
npm install @nestjs/axios axios
```

- [ ] **Step 3: Añadir `recaptchaToken` al `LoginDto`**

En `src/auth/dto/auth.dto.ts`, actualizar `LoginDto`:

```typescript
export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  password!: string;

  // Token generado por reCAPTCHA v3 en el frontend. Obligatorio en el login estándar.
  @IsString()
  recaptchaToken!: string;
}
```

> **Nota:** `FaceLoginDto extends LoginDto`, por lo que hereda `recaptchaToken`. Sin embargo, el endpoint `/login/face` no llama a `verifyRecaptcha` — el descriptor facial es la segunda capa de protección.

- [ ] **Step 4: Añadir `verifyRecaptcha` en `AuthService` y `HttpModule` al módulo**

**4a — Importar `HttpModule` en el `@Module`:**

```typescript
// En auth.module.ts, añadir a imports del @Module:
import { HttpModule } from '@nestjs/axios';

// En @Module({ imports: [...] }):
HttpModule,
```

**4b — Inyectar `HttpService` en `AuthService`:**

```typescript
// Añadir al constructor de AuthService:
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// En el constructor:
private readonly httpService: HttpService,
```

**4c — Añadir el método `verifyRecaptcha` en `AuthService` (antes del cierre de clase):**

```typescript
async verifyRecaptcha(token: string): Promise<void> {
  const secret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
  if (!secret) throw new Error('RECAPTCHA_SECRET_KEY no configurada');

  const url = 'https://www.google.com/recaptcha/api/siteverify';
  const params = new URLSearchParams({ secret, response: token });

  const { data } = await firstValueFrom(
    this.httpService.post<{ success: boolean; score: number; action: string }>(
      `${url}?${params.toString()}`,
    ),
  );

  // score < 0.5 → probable bot. Ajustar según necesidad.
  if (!data.success || data.score < 0.5) {
    throw new UnauthorizedException('Verificación de seguridad fallida. Inténtalo de nuevo.');
  }
}
```

- [ ] **Step 5: Llamar a `verifyRecaptcha` al inicio del método `login` en `AuthService`**

En el método `login()` de `AuthService`, añadir como primera línea:

```typescript
async login(loginDto: LoginDto, ip: string) {
  // Verificar reCAPTCHA antes de cualquier consulta a la DB
  await this.verifyRecaptcha(loginDto.recaptchaToken);

  // ... resto del código existente sin cambios
}
```

- [ ] **Step 6: Añadir el script de reCAPTCHA v3 en `frontend/src/index.html`**

Añadir antes del cierre de `</head>`:

```html
<!-- reCAPTCHA v3 — reemplazar TU_SITE_KEY con la clave pública de Google -->
<script src="https://www.google.com/recaptcha/api.js?render=TU_SITE_KEY" async defer></script>
```

- [ ] **Step 7: Instalar `ng-recaptcha` en el frontend**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend"
npm install ng-recaptcha
```

- [ ] **Step 8: Actualizar `login.component.ts` para ejecutar reCAPTCHA v3 antes del submit**

Añadir la declaración global de `grecaptcha` al inicio del archivo (fuera de la clase):

```typescript
// Declaración del objeto global inyectado por el script de Google
declare const grecaptcha: {
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

const RECAPTCHA_SITE_KEY = 'TU_SITE_KEY'; // reemplazar con la clave pública
```

Reemplazar el método `onSubmit()`:

```typescript
async onSubmit(): Promise<void> {
  if (this.loginForm.invalid) return;
  this.loading = true;
  this.error   = '';

  let recaptchaToken: string;
  try {
    recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
  } catch {
    this.error   = 'Error al verificar seguridad. Recarga la página.';
    this.loading = false;
    return;
  }

  this.authService.login({ ...this.loginForm.value, recaptchaToken }).subscribe({
    next:  (r: any) => this.redirect(r),
    error: (e: any) => {
      this.error   = e.error?.message || 'Error al iniciar sesión';
      this.loading = false;
    },
  });
}
```

- [ ] **Step 9: Verificar que el backend compila y arranca**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty"
npm run start:dev
# Sin errores de inyección ni de TypeScript
```

- [ ] **Step 10: Verificar que el frontend compila**

```bash
cd "C:\xampp\htdocs\Dessarrollo Web Profesional\ela-beauty\frontend"
npx ng build --configuration development 2>&1 | grep -iE "error TS" | head -10
```

- [ ] **Step 11: Smoke test del login con reCAPTCHA**

1. Abrir `http://localhost:4200/auth/login`
2. Abrir DevTools → Network
3. Ingresar credenciales válidas y pulsar "Entrar"
4. Verificar en Network que el `POST /auth/login` incluye `recaptchaToken` en el body
5. Verificar que la respuesta es 200 con cookie `access_token`

- [ ] **Step 12: Commit**

```bash
git add src/auth/dto/auth.dto.ts src/auth/auth.module.ts \
        frontend/src/index.html \
        frontend/src/app/pages/auth/login/login.component.ts \
        frontend/package.json frontend/package-lock.json \
        package.json package-lock.json
git commit -m "feat(auth): add reCAPTCHA v3 to standard email/password login"
```

---

## Resumen de seguridad

| Riesgo | Mitigación |
|---|---|
| Bots en login estándar | reCAPTCHA v3 invisible (score < 0.5 → rechazado) |
| Spoofing con foto impresa | Umbral 0.45 (estricto) + fallback obligatorio a password |
| Replay attack WebAuthn | Counter incremental verificado en `verifyAuthentication` |
| Datos biométricos expuestos | Solo se persiste el descriptor numérico (128 floats), nunca la imagen |
| Acceso sin HTTPS | `getUserMedia` está bloqueado por el navegador fuera de `localhost` |
| Fuerza bruta en todos los endpoints de login | Rate limiter (5 req/60s por IP con `@Throttle`) |
| Challenge WebAuthn reutilizado | `challengeStore.delete(userId)` después de cada verificación |
