# Email Verification + Password Reset — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar confirmación de correo en el registro y recuperación de contraseña, usando Supabase Auth como servicio de entrega de emails + validación de tokens OTP, con NestJS como intermediario y MySQL como fuente de verdad de usuarios.

**Architecture:**
NestJS crea el usuario en MySQL (`isEmailVerified=false`, `isActive=false`) y llama a `supabase.auth.signUp` para crear el shadow-user y disparar el correo de confirmación automáticamente. El correo apunta a Angular con `?token_hash=xxx&type=email`. Angular extrae los parámetros y los envía a NestJS, que llama a `supabase.auth.verifyOtp({ token_hash, type: 'email' })` para validar y activa el usuario en MySQL. Para recuperación de contraseña: NestJS llama a `supabase.auth.resetPasswordForEmail` que envía el correo, el link llega a Angular con `?token_hash=xxx&type=recovery`, Angular lo manda a NestJS, que valida con `verifyOtp({ token_hash, type: 'recovery' })` y actualiza el hash bcrypt en MySQL. **reCAPTCHA v3, JWT HttpOnly cookies y bcrypt no cambian.**

**Nota sobre tipos OTP de Supabase:** Para flujos basados en `token_hash` (link en correo), Supabase usa `type: 'email'` para confirmación de cuenta y `type: 'recovery'` para reset de contraseña. El valor `'signup'` solo aplica para OTPs de 6 dígitos (magic link), no para token_hash.

**Tech Stack:** NestJS, TypeORM, MySQL, @supabase/supabase-js, Angular 17+ standalone components, ReactiveFormsModule.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `src/supabase/supabase.service.ts` | Crear | Supabase client (service role) + helpers |
| `src/supabase/supabase.module.ts` | Crear | Módulo NestJS global injectable |
| `src/users/entities/user.entity.ts` | Modificar | Agregar columna `isEmailVerified` |
| `src/auth/dto/auth.dto.ts` | Modificar | Agregar `VerifyEmailDto`, `ForgotPasswordDto`, `ResetPasswordDto`, `ResendVerificationDto` |
| `src/auth/auth.module.ts` | Modificar | Inyectar SupabaseService, nuevos métodos en AuthService, 4 nuevos endpoints en AuthController |
| `.env` | Modificar | Agregar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `frontend/src/app/services/auth.service.ts` | Modificar | Agregar `verifyEmail()`, `forgotPassword()`, `resetPassword()`, `resendVerification()` |
| `frontend/src/app/pages/auth/verify-email/` | Crear | Página que lee `token_hash` de URL y activa la cuenta |
| `frontend/src/app/pages/auth/forgot-password/` | Crear | Formulario dual: recuperar contraseña Y reenviar verificación según la ruta |
| `frontend/src/app/pages/auth/reset-password/` | Crear | Formulario de nueva contraseña con token |
| `frontend/src/app/app.routes.ts` | Modificar | 3 nuevas rutas bajo `/auth` |
| `frontend/src/app/pages/auth/login/login.component.html` | Modificar | Link "¿Olvidaste tu contraseña?" |
| `frontend/src/app/pages/auth/register/register.component.ts` | Modificar | Mostrar mensaje "revisa tu correo", eliminar redirección al login |

---

## Task 1: Configurar proyecto Supabase (pasos manuales, sin código)

> Este task no tiene commits — es configuración en el dashboard de Supabase.

- [ ] **Step 1: Crear proyecto Supabase**

  Ve a [supabase.com](https://supabase.com) → New project.
  - Nombre: `ela-beauty`
  - Región: más cercana (e.g. `us-east-1`)
  - Contraseña DB: guárdala (no se usa en este proyecto)

- [ ] **Step 2: Copiar credenciales**

  En el proyecto → Settings → API:
  - `Project URL` → será `SUPABASE_URL`
  - `service_role secret` → será `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca expongas esto al frontend)

- [ ] **Step 3: Configurar URL del sitio y redirects**

  Authentication → URL Configuration:
  - **Site URL:** `http://localhost:4200`
  - **Redirect URLs:** agregar `http://localhost:4200/**`

- [ ] **Step 4: Configurar plantilla de correo — Confirmación de cuenta**

  Authentication → Email Templates → **Confirm signup** → editar el cuerpo del mensaje.
  Reemplazar el enlace existente por esta URL con `token_hash`:

  ```html
  <h2>Confirma tu correo electrónico</h2>
  <p>Haz clic en el siguiente enlace para activar tu cuenta en ELA Beauty:</p>
  <p>
    <a href="{{ .SiteURL }}/auth/verificar-correo?token_hash={{ .TokenHash }}&type={{ .Type }}">
      Confirmar correo
    </a>
  </p>
  <p>Este enlace expira en 24 horas.</p>
  ```

  > `{{ .Type }}` emitirá `"email"` para confirmación de cuenta. Angular recibirá `?type=email`.

- [ ] **Step 5: Configurar plantilla de correo — Recuperación de contraseña**

  Authentication → Email Templates → **Reset Password** → editar:

  ```html
  <h2>Restablece tu contraseña</h2>
  <p>Haz clic en el siguiente enlace para crear una nueva contraseña en ELA Beauty:</p>
  <p>
    <a href="{{ .SiteURL }}/auth/recuperar-contrasena?token_hash={{ .TokenHash }}&type={{ .Type }}">
      Restablecer contraseña
    </a>
  </p>
  <p>Este enlace expira en 1 hora.</p>
  ```

  > `{{ .Type }}` emitirá `"recovery"`. Angular recibirá `?type=recovery`.

- [ ] **Step 6: (Opcional) Configurar SMTP personalizado**

  Si quieres que los correos lleguen desde tu propio dominio:
  Authentication → SMTP Settings → habilitar y configurar con tu proveedor.
  Para desarrollo, el SMTP por defecto de Supabase es suficiente.

---

## Task 2: Instalar @supabase/supabase-js y crear SupabaseModule

**Files:**
- Create: `src/supabase/supabase.service.ts`
- Create: `src/supabase/supabase.module.ts`
- Modify: `.env`

- [ ] **Step 1: Instalar dependencia**

  ```bash
  cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
  npm install @supabase/supabase-js
  ```

  Esperado: instalación sin errores.

- [ ] **Step 2: Agregar variables de entorno**

  Editar `.env` — agregar al final:

  ```env
  # Supabase — usado solo para email delivery y validación de OTP tokens
  SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

  Reemplaza los valores con los copiados en el Task 1 Step 2.

- [ ] **Step 3: Crear `src/supabase/supabase.service.ts`**

  ```typescript
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { createClient, SupabaseClient } from '@supabase/supabase-js';
  import { randomUUID } from 'crypto';

  @Injectable()
  export class SupabaseService {
    readonly client: SupabaseClient;

    constructor(private readonly config: ConfigService) {
      const url = config.get<string>('SUPABASE_URL');
      const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

      if (!url || !key) {
        throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en .env');
      }

      this.client = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession:   false,
        },
      });
    }

    /**
     * Crea un shadow-user en Supabase Auth y dispara el correo de confirmación.
     * Usa auth.signUp (no admin.createUser) porque signUp envía el email automáticamente.
     * La contraseña es un UUID aleatorio — nunca se usa para login en nuestro sistema.
     */
    async createAuthUser(email: string): Promise<void> {
      const { error } = await this.client.auth.signUp({
        email,
        password: randomUUID(),
      });

      // Si el usuario ya existe en Supabase (reintento tras fallo), lo ignoramos
      if (error && !error.message.toLowerCase().includes('already registered')) {
        throw new Error(`Supabase signUp failed: ${error.message}`);
      }
    }

    /**
     * Envía el correo de recuperación de contraseña.
     * Usa el template "Reset Password" configurado en el dashboard de Supabase.
     */
    async sendPasswordRecovery(email: string): Promise<void> {
      const { error } = await this.client.auth.resetPasswordForEmail(email);
      if (error) {
        throw new Error(`Supabase resetPassword failed: ${error.message}`);
      }
    }

    /**
     * Valida un token OTP recibido del link de correo y retorna el email del usuario.
     *
     * IMPORTANTE — tipos correctos para flujos token_hash:
     *   type: 'email'    → confirmación de cuenta (link de registro)
     *   type: 'recovery' → recuperación de contraseña (link de reset)
     *
     * El valor 'signup' solo aplica para OTPs de 6 dígitos (magic link), no para token_hash.
     */
    async verifyOtp(token_hash: string, type: 'email' | 'recovery'): Promise<string> {
      const { data, error } = await this.client.auth.verifyOtp({ token_hash, type });

      if (error || !data.user?.email) {
        throw new Error('Token inválido o expirado');
      }

      return data.user.email;
    }

    /**
     * Reenvía el correo de confirmación para un email ya registrado en Supabase.
     */
    async resendConfirmation(email: string): Promise<void> {
      const { error } = await this.client.auth.resend({
        type:  'signup',
        email,
      });
      if (error) {
        throw new Error(`Supabase resend failed: ${error.message}`);
      }
    }
  }
  ```

- [ ] **Step 4: Crear `src/supabase/supabase.module.ts`**

  ```typescript
  import { Global, Module } from '@nestjs/common';
  import { SupabaseService } from './supabase.service';

  @Global()
  @Module({
    providers: [SupabaseService],
    exports:   [SupabaseService],
  })
  export class SupabaseModule {}
  ```

  > `@Global()` hace que `SupabaseService` esté disponible en cualquier módulo sin importarlo explícitamente. **No agregues `SupabaseService` al array `providers` de ningún otro módulo** — NestJS lo proveería dos veces.

- [ ] **Step 5: Importar SupabaseModule en `src/app.module.ts`**

  Agregar import al inicio del archivo:
  ```typescript
  import { SupabaseModule } from './supabase/supabase.module';
  ```

  Añadir `SupabaseModule` al array `imports:` antes de `AuthModule`.

- [ ] **Step 6: Verificar que el servidor arranca**

  ```bash
  cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
  npm run start:dev
  ```

  Esperado: NestJS arranca sin errores. No debe aparecer `Error: SUPABASE_URL...`.

- [ ] **Step 7: Commit**

  ```bash
  git add src/supabase/ src/app.module.ts .env package.json package-lock.json
  git commit -m "feat(supabase): add SupabaseModule for email delivery and OTP validation"
  ```

---

## Task 3: Actualizar entidad User — agregar isEmailVerified

**Files:**
- Modify: `src/users/entities/user.entity.ts`

- [ ] **Step 1: Agregar columna `isEmailVerified`**

  Editar `src/users/entities/user.entity.ts` — agregar después de `isActive`:

  ```typescript
  @Column({ default: false })
  isEmailVerified!: boolean;
  ```

  El bloque queda así:
  ```typescript
  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isEmailVerified!: boolean;
  ```

- [ ] **Step 2: Verificar sincronización**

  Con el servidor corriendo, TypeORM agrega la columna `is_email_verified` automáticamente (`DB_SYNCHRONIZE=true`).
  Verificar en phpMyAdmin que la columna existe con valor por defecto `0`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/users/entities/user.entity.ts
  git commit -m "feat(users): add isEmailVerified column (default false)"
  ```

---

## Task 4: Agregar DTOs para los nuevos endpoints

**Files:**
- Modify: `src/auth/dto/auth.dto.ts`

- [ ] **Step 1: Agregar los DTOs al final del archivo**

  Editar `src/auth/dto/auth.dto.ts` — agregar al final:

  ```typescript
  // ── Email Verification + Password Reset DTOs ──────────────────────────────

  /**
   * Solo acepta type: 'email' — el tipo correcto para confirmación de cuenta
   * via token_hash. Impide que un token de recovery active una cuenta.
   */
  export class VerifyEmailDto {
    @IsString()
    token_hash!: string;

    @IsIn(['email'])
    type!: 'email';
  }

  export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Email inválido' })
    email!: string;
  }

  export class ResetPasswordDto {
    @IsString()
    token_hash!: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    })
    newPassword!: string;
  }

  export class ResendVerificationDto {
    @IsEmail({}, { message: 'Email inválido' })
    email!: string;
  }
  ```

  Verificar que `IsIn` ya esté en la línea de imports (lo usa `UpdateRoleDto`).

- [ ] **Step 2: Commit**

  ```bash
  git add src/auth/dto/auth.dto.ts
  git commit -m "feat(auth): add VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto"
  ```

---

## Task 5: Actualizar flujo de registro — usuario inactivo + email de confirmación

**Files:**
- Modify: `src/auth/auth.module.ts`

- [ ] **Step 1: Inyectar SupabaseService en AuthService**

  En `src/auth/auth.module.ts`, agregar el import al inicio:
  ```typescript
  import { SupabaseService } from '../supabase/supabase.service';
  ```

  Y en el constructor de `AuthService`, agregar el parámetro:
  ```typescript
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly supabase: SupabaseService,   // ← agregar
  ) {}
  ```

  > **No agregues `SupabaseService` al array `providers` del `@Module`** — ya es global y NestJS lo inyecta automáticamente. Solo va en el constructor.

- [ ] **Step 2: Reemplazar el método `register` en `AuthService`**

  Reemplazar el método `register` completo con:

  ```typescript
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // 1. Validar reCAPTCHA
    if (registerDto.recaptchaToken) {
      await this.verifyRecaptcha(registerDto.recaptchaToken);
    }

    // 2. Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      // Usuario existe pero nunca confirmó su correo → reenviar verificación
      if (!existingUser.isEmailVerified) {
        try {
          await this.supabase.resendConfirmation(existingUser.email);
        } catch {
          // Ignorar error de Supabase — respuesta genérica al usuario
        }
        return { message: 'Ya existe un registro pendiente de verificación. Te hemos reenviado el correo de confirmación.' };
      }
      throw new BadRequestException('El correo ya está registrado');
    }

    // 3. Crear usuario en MySQL (inactivo, sin verificar)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const { recaptchaToken: _, ...userData } = registerDto;
    const newUser = this.userRepository.create({
      ...userData,
      password:        hashedPassword,
      isActive:        false,
      isEmailVerified: false,
    });
    const savedUser = await this.userRepository.save(newUser);

    // 4. Crear shadow-user en Supabase y disparar email de confirmación
    //    Si Supabase falla, eliminar el usuario de MySQL para evitar huérfanos
    try {
      await this.supabase.createAuthUser(registerDto.email);
    } catch (err) {
      await this.userRepository.delete(savedUser.id);
      throw new BadRequestException('No se pudo enviar el correo de confirmación. Inténtalo de nuevo.');
    }

    return { message: 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.' };
  }
  ```

- [ ] **Step 3: Verificar que el endpoint retorna 201 con el mensaje correcto**

  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "firstName": "Ana",
      "apellidoPaterno": "García",
      "apellidoMaterno": "López",
      "email": "ana.test@example.com",
      "password": "Test1234"
    }'
  ```

  Esperado: `201` con `{ "message": "Registro exitoso. Revisa tu correo para confirmar tu cuenta." }`

  Verificar en el dashboard de Supabase → Authentication → Users que el usuario aparece con email no confirmado y que el correo llega a la bandeja de entrada.

- [ ] **Step 4: Commit**

  ```bash
  git add src/auth/auth.module.ts
  git commit -m "feat(auth): register creates inactive user and triggers Supabase confirmation email"
  ```

---

## Task 6: Agregar endpoint POST /auth/verificar-correo

**Files:**
- Modify: `src/auth/auth.module.ts`

- [ ] **Step 1: Agregar método `verifyEmail` en `AuthService`**

  Después del método `register`, agregar:

  ```typescript
  async verifyEmail(token_hash: string): Promise<{ message: string }> {
    let email: string;
    try {
      // type: 'email' es el tipo correcto para confirmación de cuenta via token_hash
      email = await this.supabase.verifyOtp(token_hash, 'email');
    } catch {
      throw new BadRequestException('El enlace de confirmación es inválido o ya expiró.');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }
    if (user.isEmailVerified) {
      return { message: 'Tu correo ya estaba confirmado. Puedes iniciar sesión.' };
    }

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      isActive:        true,
    });

    return { message: 'Correo confirmado correctamente. Ya puedes iniciar sesión.' };
  }
  ```

- [ ] **Step 2: Actualizar imports de DTOs en AuthController**

  Reemplazar la línea de import de DTOs en `src/auth/auth.module.ts`:

  ```typescript
  import {
    RegisterDto, LoginDto, UpdateRoleDto,
    WebAuthnVerifyRegistrationDto, WebAuthnVerifyAuthDto,
    FaceDescriptorDto, FaceLoginDto, FaceOnlyLoginDto,
    VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto,
  } from './dto/auth.dto';
  ```

- [ ] **Step 3: Agregar `@Throttle` al endpoint `register` existente y el nuevo endpoint**

  En `AuthController`, el endpoint `register` existente no tiene throttle. Agregarlo ahora
  (previene spam de registros que agotaría la cuota de emails de Supabase):

  ```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  ```

  Después, agregar el nuevo endpoint:

  ```typescript
  @Post('verificar-correo')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token_hash);
  }
  ```

  > El DTO ya garantiza `type: 'email'` — el servicio no necesita recibirlo como parámetro.

- [ ] **Step 4: Probar el endpoint con token real**

  Registra un usuario, abre el email, copia el `token_hash` de la URL del link, y llama:

  ```bash
  curl -X POST http://localhost:3000/api/auth/verificar-correo \
    -H "Content-Type: application/json" \
    -d '{ "token_hash": "PEGAR_AQUI_EL_TOKEN", "type": "email" }'
  ```

  Esperado: `200` con `{ "message": "Correo confirmado correctamente. Ya puedes iniciar sesión." }`
  Verificar en MySQL: `is_email_verified=1`, `is_active=1` para ese usuario.

- [ ] **Step 5: Commit**

  ```bash
  git add src/auth/auth.module.ts
  git commit -m "feat(auth): add POST /auth/verificar-correo endpoint"
  ```

---

## Task 7: Bloquear login para usuarios no verificados + endpoint reenviar verificación

**Files:**
- Modify: `src/auth/auth.module.ts`

- [ ] **Step 1: Actualizar método `login` para bloquear usuarios no verificados**

  En el método `login` de `AuthService`, después del bloque `if (!isMatch)`, agregar:

  ```typescript
  if (!user.isEmailVerified) {
    throw new UnauthorizedException(
      'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
    );
  }
  ```

- [ ] **Step 2: Agregar método `resendVerification` en `AuthService`**

  ```typescript
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Respuesta genérica — no revelar si el email existe o no
    const genericMessage = { message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.' };

    if (!user || user.isEmailVerified) {
      return genericMessage;
    }

    try {
      await this.supabase.resendConfirmation(email);
    } catch (err) {
      console.error('[Auth] resendVerification Supabase error:', err);
    }

    return genericMessage;
  }
  ```

- [ ] **Step 3: Agregar endpoints en `AuthController`**

  Agregar los decoradores `@Throttle` para proteger de spam (igual que login):

  ```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('reenviar-verificacion')
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }
  ```

- [ ] **Step 4: Probar que el login rechaza usuarios no verificados**

  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{ "email": "no-verificado@example.com", "password": "Test1234", "recaptchaToken": "test" }'
  ```

  Esperado: `401` con mensaje `"Debes confirmar tu correo antes de iniciar sesión."`.

- [ ] **Step 5: Commit**

  ```bash
  git add src/auth/auth.module.ts
  git commit -m "feat(auth): block unverified login + add POST /auth/reenviar-verificacion"
  ```

---

## Task 8: Agregar endpoint POST /auth/olvide-contrasena

**Files:**
- Modify: `src/auth/auth.module.ts`

- [ ] **Step 1: Agregar método `forgotPassword` en `AuthService`**

  ```typescript
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Respuesta genérica — no revelar si el correo existe en el sistema
    const genericMessage = { message: 'Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.' };

    if (!user || !user.isEmailVerified || !user.isActive) {
      return genericMessage;
    }

    try {
      await this.supabase.sendPasswordRecovery(email);
    } catch (err) {
      console.error('[Auth] forgotPassword Supabase error:', err);
      // No relanzar — respuesta genérica al usuario siempre
    }

    return genericMessage;
  }
  ```

- [ ] **Step 2: Agregar endpoint en `AuthController`** con rate limiting:

  ```typescript
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('olvide-contrasena')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }
  ```

- [ ] **Step 3: Probar el endpoint**

  ```bash
  curl -X POST http://localhost:3000/api/auth/olvide-contrasena \
    -H "Content-Type: application/json" \
    -d '{ "email": "cualquier-correo@example.com" }'
  ```

  Esperado: `200` con el mensaje genérico, independientemente de si el email existe o no.
  Si el email existe y está verificado, debe llegar el correo de recuperación con el link configurado en el Task 1 Step 5.

- [ ] **Step 4: Commit**

  ```bash
  git add src/auth/auth.module.ts
  git commit -m "feat(auth): add POST /auth/olvide-contrasena with generic response + throttle"
  ```

---

## Task 9: Agregar endpoint POST /auth/nueva-contrasena

**Files:**
- Modify: `src/auth/auth.module.ts`

- [ ] **Step 1: Agregar método `resetPassword` en `AuthService`**

  ```typescript
  async resetPassword(token_hash: string, newPassword: string): Promise<{ message: string }> {
    let email: string;
    try {
      // type: 'recovery' es el tipo correcto para reset de contraseña via token_hash
      email = await this.supabase.verifyOtp(token_hash, 'recovery');
    } catch {
      throw new BadRequestException('El enlace de recuperación es inválido o ya expiró.');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.userRepository.update(user.id, { password: hashedPassword });

    return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }
  ```

- [ ] **Step 2: Agregar endpoint en `AuthController`**

  ```typescript
  @Post('nueva-contrasena')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token_hash, body.newPassword);
  }
  ```

- [ ] **Step 3: Probar el endpoint con token real**

  Solicita un reset, abre el correo, copia el `token_hash` del link, y llama:

  ```bash
  curl -X POST http://localhost:3000/api/auth/nueva-contrasena \
    -H "Content-Type: application/json" \
    -d '{ "token_hash": "PEGAR_AQUI", "newPassword": "NuevaClave1" }'
  ```

  Esperado: `200` con `{ "message": "Contraseña actualizada correctamente..." }`.
  Verificar haciendo login con el nuevo password.

- [ ] **Step 4: Commit**

  ```bash
  git add src/auth/auth.module.ts
  git commit -m "feat(auth): add POST /auth/nueva-contrasena endpoint"
  ```

---

## Task 10: Angular AuthService — agregar nuevos métodos + actualizar registro

**Files:**
- Modify: `frontend/src/app/services/auth.service.ts`
- Modify: `frontend/src/app/pages/auth/register/register.component.ts`
- Modify: `frontend/src/app/pages/auth/register/register.component.html`

- [ ] **Step 1: Agregar métodos en `auth.service.ts`**

  Agregar después del método `updateProfile`:

  ```typescript
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
  ```

- [ ] **Step 2: Actualizar `register.component.ts`**

  Realizar estos 3 cambios:

  **2a.** Eliminar `Router` del import y del constructor (ya no se redirige automáticamente):
  ```typescript
  // Antes:
  import { Router, RouterModule } from '@angular/router';
  // Después:
  import { RouterModule } from '@angular/router';
  ```
  Y en el constructor, eliminar `private router: Router`.

  Eliminar también el import y la propiedad de `NotificationService`:
  ```typescript
  // Eliminar esta línea de imports:
  import { NotificationService } from '../../../services/notification.service';
  // Eliminar esta propiedad de la clase:
  private notif = inject(NotificationService);
  ```
  Y eliminar el `inject` del import de `@angular/core` si `inject` ya no se usa en otro lugar del componente.

  **2b.** Agregar propiedad `successMsg`:
  ```typescript
  error: string = '';
  loading: boolean = false;
  successMsg: string = '';
  ```

  **2c.** Reemplazar el bloque `next` del subscribe en `onSubmit()`:
  ```typescript
  next: () => {
    this.successMsg = 'Registro exitoso. Revisa tu correo y confirma tu cuenta para poder iniciar sesión.';
    this.loading = false;
  },
  ```
  Eliminar también las líneas de `NotificationService` y `setTimeout`/`router.navigate` que existían.

- [ ] **Step 3: Actualizar `register.component.html`**

  Reemplazar el bloque `<div *ngIf="error"...>` por:
  ```html
  <div *ngIf="successMsg" class="alert alert-success">
    {{ successMsg }}
  </div>
  <div *ngIf="error" class="alert alert-danger">
    {{ error }}
  </div>
  ```

  Actualizar el botón para deshabilitar después del éxito:
  ```html
  <button type="submit" class="btn-maybelline" [disabled]="registerForm.invalid || loading || !!successMsg">
    {{ loading ? 'Registrando...' : 'Registrarse' }}
  </button>
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/app/services/auth.service.ts
  git add frontend/src/app/pages/auth/register/register.component.ts
  git add frontend/src/app/pages/auth/register/register.component.html
  git commit -m "feat(register): show success message + remove auto-redirect after registration"
  ```

---

## Task 11: Angular — página de verificación de correo

**Files:**
- Create: `frontend/src/app/pages/auth/verify-email/verify-email.component.ts`
- Create: `frontend/src/app/pages/auth/verify-email/verify-email.component.html`

> Recibe `?token_hash=xxx&type=email` del link del correo de Supabase, llama al backend y muestra el resultado. No necesita leer `type` de la URL porque el servicio siempre envía `type: 'email'` al backend.

- [ ] **Step 1: Crear `verify-email.component.ts`**

  ```typescript
  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ActivatedRoute, RouterModule } from '@angular/router';
  import { AuthService } from '../../../services/auth.service';

  @Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './verify-email.component.html',
    styleUrls: ['../login/login.component.scss']
  })
  export class VerifyEmailComponent implements OnInit {
    status: 'loading' | 'success' | 'error' = 'loading';
    message = '';

    constructor(
      private route:       ActivatedRoute,
      private authService: AuthService,
    ) {}

    ngOnInit(): void {
      const token_hash = this.route.snapshot.queryParamMap.get('token_hash');

      if (!token_hash) {
        this.status  = 'error';
        this.message = 'Enlace inválido. No se encontró el token de verificación.';
        return;
      }

      this.authService.verifyEmail(token_hash).subscribe({
        next: (res: any) => {
          this.status  = 'success';
          this.message = res.message;
        },
        error: (err: any) => {
          this.status  = 'error';
          this.message = err.error?.message || 'El enlace de confirmación es inválido o ya expiró.';
        },
      });
    }
  }
  ```

- [ ] **Step 2: Crear `verify-email.component.html`**

  ```html
  <div class="auth-container fade-in">
    <div class="auth-card">

      <div class="auth-header">
        <h2>Verificación de Correo</h2>
      </div>

      <div *ngIf="status === 'loading'" class="auth-form" style="text-align:center; padding: 2rem 0;">
        <p>Verificando tu correo...</p>
      </div>

      <div *ngIf="status === 'success'" class="auth-form">
        <div class="alert alert-success">{{ message }}</div>
        <a routerLink="/auth/login" class="btn-maybelline" style="display:block; text-align:center; margin-top:1rem;">
          Ir al inicio de sesión
        </a>
      </div>

      <div *ngIf="status === 'error'" class="auth-form">
        <div class="alert alert-danger">{{ message }}</div>
        <p style="margin-top:1rem; text-align:center; font-size:0.9rem;">
          ¿El enlace expiró?
          <a routerLink="/auth/reenviar-verificacion">Solicitar un nuevo enlace</a>
        </p>
        <a routerLink="/auth/login" class="btn-outline" style="display:block; text-align:center; margin-top:0.5rem;">
          Volver al login
        </a>
      </div>

    </div>
  </div>
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/app/pages/auth/verify-email/
  git commit -m "feat(verify-email): add email verification page"
  ```

---

## Task 12: Angular — página de olvidé mi contraseña / reenviar verificación

**Files:**
- Create: `frontend/src/app/pages/auth/forgot-password/forgot-password.component.ts`
- Create: `frontend/src/app/pages/auth/forgot-password/forgot-password.component.html`

> Este componente se reutiliza para dos rutas: `/auth/olvide-contrasena` y `/auth/reenviar-verificacion`. El modo se detecta automáticamente por la URL activa.

- [ ] **Step 1: Crear `forgot-password.component.ts`**

  ```typescript
  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
  import { Router, RouterModule } from '@angular/router';
  import { AuthService } from '../../../services/auth.service';

  @Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['../login/login.component.scss']
  })
  export class ForgotPasswordComponent implements OnInit {
    form: FormGroup;
    loading  = false;
    sent     = false;
    error    = '';

    /** true cuando la ruta es /auth/reenviar-verificacion */
    isResendMode = false;

    constructor(
      private fb:          FormBuilder,
      private router:      Router,
      private authService: AuthService,
    ) {
      this.form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
      });
    }

    ngOnInit(): void {
      this.isResendMode = this.router.url.includes('reenviar-verificacion');
    }

    get title(): string {
      return this.isResendMode ? 'Reenviar Confirmación' : 'Recuperar Contraseña';
    }

    get subtitle(): string {
      return this.isResendMode
        ? 'Te reenviaremos el enlace de confirmación de cuenta'
        : 'Te enviaremos un enlace para restablecer tu contraseña';
    }

    get buttonLabel(): string {
      return this.isResendMode ? 'Reenviar enlace de verificación' : 'Enviar enlace de recuperación';
    }

    onSubmit(): void {
      if (this.form.invalid) return;
      this.loading = true;
      this.error   = '';

      const obs = this.isResendMode
        ? this.authService.resendVerification(this.form.value.email)
        : this.authService.forgotPassword(this.form.value.email);

      obs.subscribe({
        next: () => {
          this.sent    = true;
          this.loading = false;
        },
        error: (err: any) => {
          this.error   = err.error?.message || 'Error al procesar la solicitud.';
          this.loading = false;
        },
      });
    }
  }
  ```

- [ ] **Step 2: Crear `forgot-password.component.html`**

  ```html
  <div class="auth-container fade-in">
    <div class="auth-card">

      <div class="auth-header">
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>

      <div *ngIf="!sent">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input type="email" id="email" formControlName="email" placeholder="ejemplo@correo.com">
          </div>

          <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

          <button type="submit" class="btn-maybelline" [disabled]="form.invalid || loading">
            {{ loading ? 'Enviando...' : buttonLabel }}
          </button>
        </form>
      </div>

      <div *ngIf="sent" class="auth-form">
        <div class="alert alert-success">
          Si el correo existe en nuestra base de datos, recibirás un enlace en tu bandeja de entrada. Revisa también la carpeta de spam.
        </div>
      </div>

      <div class="auth-footer">
        <p><a routerLink="/auth/login">Volver al inicio de sesión</a></p>
      </div>

    </div>
  </div>
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/app/pages/auth/forgot-password/
  git commit -m "feat(forgot-password): add dual-mode page for password recovery and resend verification"
  ```

---

## Task 13: Angular — página de nueva contraseña

**Files:**
- Create: `frontend/src/app/pages/auth/reset-password/reset-password.component.ts`
- Create: `frontend/src/app/pages/auth/reset-password/reset-password.component.html`

> Lee `token_hash` de la URL. **No lee `type`** — el servicio hardcodea `type: 'recovery'` internamente.

- [ ] **Step 1: Crear `reset-password.component.ts`**

  ```typescript
  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import {
    ReactiveFormsModule, FormBuilder, FormGroup,
    Validators, AbstractControl, ValidationErrors
  } from '@angular/forms';
  import { ActivatedRoute, RouterModule } from '@angular/router';
  import { AuthService } from '../../../services/auth.service';

  function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirm  = group.get('confirmPassword')?.value;
    if (!confirm) return null;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  @Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['../login/login.component.scss']
  })
  export class ResetPasswordComponent implements OnInit {
    form: FormGroup;
    token_hash = '';
    loading    = false;
    done       = false;
    error      = '';

    constructor(
      private fb:          FormBuilder,
      private route:       ActivatedRoute,
      private authService: AuthService,
    ) {
      this.form = this.fb.group({
        newPassword:     ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
        ]],
        confirmPassword: ['', Validators.required],
      }, { validators: passwordsMatchValidator });
    }

    ngOnInit(): void {
      this.token_hash = this.route.snapshot.queryParamMap.get('token_hash') ?? '';
      if (!this.token_hash) {
        this.error = 'Enlace inválido. Solicita un nuevo enlace de recuperación.';
      }
    }

    get passwordValue(): string {
      return this.form.get('newPassword')?.value ?? '';
    }

    get passwordsMatch(): boolean {
      return !this.form.hasError('passwordsMismatch');
    }

    get confirmTouched(): boolean {
      return !!this.form.get('confirmPassword')?.touched;
    }

    onSubmit(): void {
      if (this.form.invalid || !this.token_hash) return;
      this.loading = true;
      this.error   = '';

      this.authService.resetPassword(this.token_hash, this.form.value.newPassword).subscribe({
        next: () => {
          this.done    = true;
          this.loading = false;
        },
        error: (err: any) => {
          this.error   = err.error?.message || 'El enlace es inválido o ya expiró.';
          this.loading = false;
        },
      });
    }
  }
  ```

- [ ] **Step 2: Crear `reset-password.component.html`**

  ```html
  <div class="auth-container fade-in">
    <div class="auth-card">

      <div class="auth-header">
        <h2>Nueva Contraseña</h2>
        <p>Elige una contraseña segura para tu cuenta</p>
      </div>

      <div *ngIf="error && !token_hash" class="auth-form">
        <div class="alert alert-danger">{{ error }}</div>
        <a routerLink="/auth/olvide-contrasena" class="btn-outline" style="display:block;text-align:center;margin-top:1rem;">
          Solicitar nuevo enlace
        </a>
      </div>

      <div *ngIf="!done && token_hash">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="newPassword">Nueva Contraseña</label>
            <input type="password" id="newPassword" formControlName="newPassword" placeholder="Mínimo 8 caracteres">
            <ul class="password-rules" *ngIf="passwordValue.length > 0">
              <li [class.rule-ok]="passwordValue.length >= 8" [class.rule-fail]="passwordValue.length < 8">
                {{ passwordValue.length >= 8 ? '✓' : '✗' }} Mínimo 8 caracteres
              </li>
              <li [class.rule-ok]="/[A-Z]/.test(passwordValue)" [class.rule-fail]="!/[A-Z]/.test(passwordValue)">
                {{ /[A-Z]/.test(passwordValue) ? '✓' : '✗' }} Una letra mayúscula
              </li>
              <li [class.rule-ok]="/[a-z]/.test(passwordValue)" [class.rule-fail]="!/[a-z]/.test(passwordValue)">
                {{ /[a-z]/.test(passwordValue) ? '✓' : '✗' }} Una letra minúscula
              </li>
              <li [class.rule-ok]="/\d/.test(passwordValue)" [class.rule-fail]="!/\d/.test(passwordValue)">
                {{ /\d/.test(passwordValue) ? '✓' : '✗' }} Un número
              </li>
            </ul>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input type="password" id="confirmPassword" formControlName="confirmPassword" placeholder="Repite tu contraseña">
            <span class="error-msg" *ngIf="confirmTouched && !passwordsMatch">
              <small>Las contraseñas no coinciden</small>
            </span>
          </div>

          <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

          <button type="submit" class="btn-maybelline" [disabled]="form.invalid || loading">
            {{ loading ? 'Guardando...' : 'Guardar nueva contraseña' }}
          </button>
        </form>
      </div>

      <div *ngIf="done" class="auth-form">
        <div class="alert alert-success">
          Contraseña actualizada correctamente.
        </div>
        <a routerLink="/auth/login" class="btn-maybelline" style="display:block;text-align:center;margin-top:1rem;">
          Ir al inicio de sesión
        </a>
      </div>

    </div>
  </div>
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/app/pages/auth/reset-password/
  git commit -m "feat(reset-password): add new password page with strength indicator"
  ```

---

## Task 14: Registrar rutas y agregar link en login

**Files:**
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/pages/auth/login/login.component.html`

- [ ] **Step 1: Agregar las nuevas rutas en `app.routes.ts`**

  Reemplazar el bloque `auth` children completo:

  ```typescript
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
        title: 'ELA Beauty - Iniciar Sesión'
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'ELA Beauty - Registro'
      },
      {
        path: 'verificar-correo',
        loadComponent: () => import('./pages/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
        title: 'ELA Beauty - Verificar Correo'
      },
      {
        path: 'olvide-contrasena',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'ELA Beauty - Recuperar Contraseña'
      },
      {
        path: 'recuperar-contrasena',
        loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'ELA Beauty - Nueva Contraseña'
      },
      {
        path: 'reenviar-verificacion',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'ELA Beauty - Reenviar Verificación'
      },
    ]
  },
  ```

- [ ] **Step 2: Agregar link "¿Olvidaste tu contraseña?" en `login.component.html`**

  Reemplazar el bloque `auth-footer`:

  ```html
  <div class="auth-footer">
    <p><a routerLink="/auth/olvide-contrasena">¿Olvidaste tu contraseña?</a></p>
    <p>¿No tienes una cuenta? <a routerLink="/auth/register">Regístrate aquí</a></p>
  </div>
  ```

- [ ] **Step 3: Verificar en navegador**

  ```bash
  cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
  npm run frontend
  ```

  Checklist manual:
  - [ ] `/auth/register` → al registrar muestra "Revisa tu correo", botón se deshabilita
  - [ ] `/auth/login` → muestra link "¿Olvidaste tu contraseña?"
  - [ ] `/auth/olvide-contrasena` → título "Recuperar Contraseña", llama a forgotPassword
  - [ ] `/auth/reenviar-verificacion` → título "Reenviar Confirmación", llama a resendVerification
  - [ ] `/auth/verificar-correo?token_hash=INVALIDO` → muestra error con link para reenviar
  - [ ] `/auth/recuperar-contrasena?token_hash=INVALIDO` → muestra error con link para nuevo enlace
  - [ ] Login con usuario no verificado → error claro con indicación de confirmar correo
  - [ ] Flujo completo — registro → confirmar correo → login exitoso
  - [ ] Flujo completo — forgot → link email → nueva contraseña → login

- [ ] **Step 4: Commit final**

  ```bash
  git add frontend/src/app/app.routes.ts
  git add frontend/src/app/pages/auth/login/login.component.html
  git commit -m "feat(auth): add routes for verify-email, forgot-password, reset-password + login link"
  ```

---

## Notas de despliegue (Vercel + Railway)

Cuando despliegues el proyecto, actualizar lo siguiente:

**Variables de entorno en Railway (backend):**
```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**En Supabase dashboard → Authentication → URL Configuration:**
- Site URL: `https://tu-dominio.vercel.app`
- Redirect URLs: `https://tu-dominio.vercel.app/**`

Las plantillas de correo ya usan `{{ .SiteURL }}` — al cambiar el Site URL en el dashboard, todos los links del correo apuntarán automáticamente al dominio de producción.
