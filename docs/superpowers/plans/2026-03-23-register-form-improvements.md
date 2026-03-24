# Register Form Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dividir el campo apellido en paterno/materno, agregar confirmación de contraseña y un indicador visual de fuerza de contraseña en el formulario de registro.

**Architecture:** Se actualizan primero las capas de datos (entidad y DTO del backend), luego los archivos del backend que referencian `lastName` directamente (admin seed, webauthn, admin-users), después el componente de registro Angular (lógica TS, template HTML y estilos), y finalmente los componentes que muestran el nombre completo del usuario (admin panel, perfil). El indicador de contraseña es reactivo puro en el frontend; el backend ya tiene las validaciones reales (`minLength(8)` + regex mayúscula/minúscula/número). `confirmPassword` se valida con un validador cruzado en el `FormGroup` y **nunca se envía al backend**.

**Tech Stack:** NestJS + TypeORM, Angular 17+ standalone components, ReactiveFormsModule, SCSS con variables CSS de tema.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/users/entities/user.entity.ts` | Reemplazar `lastName` por `apellidoPaterno` + `apellidoMaterno` |
| `src/auth/dto/auth.dto.ts` | Actualizar `RegisterDto` |
| `src/admin/admin.service.ts` | Actualizar seed del admin (usa `lastName` en línea 32) |
| `src/auth/webauthn.service.ts` | Actualizar referencia `user.lastName` en línea 49 |
| `src/admin/users/admin-users.service.ts` | Actualizar array `select` que incluye `'lastName'` en línea 20 |
| `frontend/.../register/register.component.ts` | Nuevo FormGroup con validador cruzado y getters de fuerza |
| `frontend/.../register/register.component.html` | Nuevos campos + indicador de contraseña |
| `frontend/.../admin/dashboard/dashboard.component.html` | Actualizar línea 62: `user.lastName` → `user.apellidoPaterno` |
| `frontend/.../admin/users/users.component.html` | Actualizar línea 24: columna Apellido y cabecera |
| `frontend/.../profile/profile.component.ts` | Reemplazar `lastName` por `apellidoPaterno` + `apellidoMaterno` |
| `frontend/.../profile/profile.component.html` | Reemplazar campo Apellido por dos campos |
| `frontend/.../login/login.component.scss` | Agregar estilos del indicador de fuerza (register importa este archivo) |

---

## Task 1: Actualizar entidad de usuario

**Files:**
- Modify: `src/users/entities/user.entity.ts:18`

- [ ] **Step 1: Reemplazar la columna `lastName` por dos columnas**

Editar `src/users/entities/user.entity.ts` — reemplazar exactamente:
```typescript
@Column()
lastName!: string;
```
con:
```typescript
@Column()
apellidoPaterno!: string;

@Column()
apellidoMaterno!: string;
```

- [ ] **Step 2: Commit**

```bash
git add src/users/entities/user.entity.ts
git commit -m "feat(users): split lastName into apellidoPaterno + apellidoMaterno"
```

> Nota de base de datos: TypeORM con `synchronize: true` eliminará la columna `last_name` y creará `apellido_paterno` y `apellido_materno`. En desarrollo es aceptable; en producción se requeriría una migración.

---

## Task 2: Actualizar DTO de registro

**Files:**
- Modify: `src/auth/dto/auth.dto.ts`

- [ ] **Step 1: Actualizar `RegisterDto`**

Editar `src/auth/dto/auth.dto.ts` — reemplazar en `RegisterDto`:
```typescript
@IsString()
lastName!: string;
```
con:
```typescript
@IsString()
apellidoPaterno!: string;

@IsString()
apellidoMaterno!: string;
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/dto/auth.dto.ts
git commit -m "feat(auth): update RegisterDto with apellidoPaterno + apellidoMaterno"
```

---

## Task 3: Actualizar referencias a `lastName` en otros archivos del backend

**Files:**
- Modify: `src/admin/admin.service.ts:32`
- Modify: `src/auth/webauthn.service.ts:49`
- Modify: `src/admin/users/admin-users.service.ts:20`

- [ ] **Step 1: Actualizar seed del admin en `admin.service.ts`**

Editar `src/admin/admin.service.ts` línea 32 — reemplazar:
```typescript
lastName: 'ELA Beauty',
```
con:
```typescript
apellidoPaterno: 'ELA',
apellidoMaterno: 'Beauty',
```

- [ ] **Step 2: Actualizar referencia en `webauthn.service.ts`**

Editar `src/auth/webauthn.service.ts` línea 49 — reemplazar:
```typescript
userDisplayName: `${user.firstName} ${user.lastName}`,
```
con:
```typescript
userDisplayName: `${user.firstName} ${user.apellidoPaterno}`,
```

- [ ] **Step 3: Actualizar el array `select` en `admin-users.service.ts`**

Editar `src/admin/users/admin-users.service.ts` línea 20 — reemplazar:
```typescript
select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
```
con:
```typescript
select: ['id', 'email', 'firstName', 'apellidoPaterno', 'apellidoMaterno', 'role', 'isActive', 'createdAt'],
```

- [ ] **Step 4: Verificar que el servidor compila y arranca sin errores**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
npm run start:dev
```
Esperado: NestJS arranca sin errores de TypeScript. TypeORM sincroniza el esquema (crea `apellido_paterno` y `apellido_materno`, elimina `last_name`).

- [ ] **Step 5: Probar el endpoint de registro**

Con el servidor corriendo:
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
Esperado: respuesta `201` con objeto de usuario que incluye `apellidoPaterno` y `apellidoMaterno` (sin `password`).

Probar validación — enviar sin los campos requeridos:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ana",
    "email": "ana.test2@example.com",
    "password": "Test1234"
  }'
```
Esperado: respuesta `400`. El rechazo ocurre porque `apellidoPaterno` y `apellidoMaterno` son campos requeridos (`@IsString()`) y están ausentes — `class-validator` no rechaza campos desconocidos, pero sí exige los declarados.

- [ ] **Step 6: Commit**

```bash
git add src/admin/admin.service.ts src/auth/webauthn.service.ts src/admin/users/admin-users.service.ts
git commit -m "fix: update lastName references in admin seed, webauthn service and admin-users select"
```

---

## Task 4: Actualizar lógica del componente de registro (TS)

**Files:**
- Modify: `frontend/src/app/pages/auth/register/register.component.ts`

- [ ] **Step 1: Reemplazar el bloque de imports completo**

Reemplazar las líneas de import al inicio del archivo por:
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder,
  FormGroup, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
```

- [ ] **Step 2: Agregar validador cruzado antes de `@Component`**

Justo antes de la línea `@Component({`, agregar:
```typescript
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm  = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { passwordsMismatch: true };
}
```

- [ ] **Step 3: Actualizar el `FormGroup` en el constructor**

Reemplazar el `FormGroup` existente (líneas `this.registerForm = this.fb.group({...})`) por:
```typescript
this.registerForm = this.fb.group({
  firstName:       ['', Validators.required],
  apellidoPaterno: ['', Validators.required],
  apellidoMaterno: ['', Validators.required],
  email:           ['', [Validators.required, Validators.email]],
  password:        ['', [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  ]],
  confirmPassword: ['', Validators.required]
}, { validators: passwordsMatchValidator });
```

- [ ] **Step 4: Agregar getters de fuerza de contraseña dentro de la clase**

Después de las propiedades `error` y `loading`, agregar:
```typescript
get passwordValue(): string {
  return this.registerForm.get('password')?.value ?? '';
}

get passwordRules() {
  const v = this.passwordValue;
  return {
    minLength: v.length >= 8,
    hasUpper:  /[A-Z]/.test(v),
    hasLower:  /[a-z]/.test(v),
    hasNumber: /\d/.test(v),
  };
}

get passwordsMatch(): boolean {
  return !this.registerForm.hasError('passwordsMismatch');
}

get confirmTouched(): boolean {
  return !!this.registerForm.get('confirmPassword')?.touched;
}
```

- [ ] **Step 5: Actualizar `onSubmit()` para excluir `confirmPassword` del payload**

En el método `onSubmit()`, reemplazar la línea:
```typescript
this.authService.register({ ...this.registerForm.value, recaptchaToken })
```
por:
```typescript
const { confirmPassword: _, ...formData } = this.registerForm.value;
this.authService.register({ ...formData, recaptchaToken })
```

- [ ] **Step 6: Verificar compilación**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx ng build --configuration development 2>&1 | tail -20
```
Esperado: sin errores de TypeScript.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/pages/auth/register/register.component.ts
git commit -m "feat(register): add confirmPassword validator and password strength getters"
```

---

## Task 5: Actualizar el template HTML del registro

**Files:**
- Modify: `frontend/src/app/pages/auth/register/register.component.html`

El archivo actual tiene este bloque (líneas 9–18) que debe reemplazarse:
```html
<div class="row">
    <div class="form-group col">
        <label for="firstName">Nombre</label>
        <input type="text" id="firstName" formControlName="firstName" placeholder="Tu nombre">
    </div>
    <div class="form-group col">
        <label for="lastName">Apellido</label>
        <input type="text" id="lastName" formControlName="lastName" placeholder="Tu apellido">
    </div>
</div>
```

- [ ] **Step 1: Reemplazar el bloque `.row` (sólo esas 10 líneas) por los tres campos de nombre**

```html
<div class="row">
    <div class="form-group col">
        <label for="firstName">Nombre</label>
        <input type="text" id="firstName" formControlName="firstName" placeholder="Tu nombre">
    </div>
    <div class="form-group col">
        <label for="apellidoPaterno">Apellido Paterno</label>
        <input type="text" id="apellidoPaterno" formControlName="apellidoPaterno" placeholder="Apellido paterno">
    </div>
</div>

<div class="form-group">
    <label for="apellidoMaterno">Apellido Materno</label>
    <input type="text" id="apellidoMaterno" formControlName="apellidoMaterno" placeholder="Apellido materno">
</div>
```

Los bloques de `email`, `password`, error y botón que siguen a continuación **no se tocan**.

- [ ] **Step 2: Reemplazar el bloque del campo `password` por el campo + indicador de reglas**

Reemplazar el bloque actual del campo password:
```html
<div class="form-group">
    <label for="password">Contraseña</label>
    <input type="password" id="password" formControlName="password" placeholder="Mínimo 6 caracteres">
</div>
```
por:
```html
<div class="form-group">
    <label for="password">Contraseña</label>
    <input type="password" id="password" formControlName="password" placeholder="Mínimo 8 caracteres">
    <ul class="password-rules" *ngIf="passwordValue.length > 0">
        <li [class.rule-ok]="passwordRules.minLength" [class.rule-fail]="!passwordRules.minLength">
            {{ passwordRules.minLength ? '✓' : '✗' }} Mínimo 8 caracteres
        </li>
        <li [class.rule-ok]="passwordRules.hasUpper" [class.rule-fail]="!passwordRules.hasUpper">
            {{ passwordRules.hasUpper ? '✓' : '✗' }} Una letra mayúscula
        </li>
        <li [class.rule-ok]="passwordRules.hasLower" [class.rule-fail]="!passwordRules.hasLower">
            {{ passwordRules.hasLower ? '✓' : '✗' }} Una letra minúscula
        </li>
        <li [class.rule-ok]="passwordRules.hasNumber" [class.rule-fail]="!passwordRules.hasNumber">
            {{ passwordRules.hasNumber ? '✓' : '✗' }} Un número
        </li>
    </ul>
</div>
```

- [ ] **Step 3: Agregar el campo `confirmPassword` justo después del bloque de password**

Insertar antes del bloque `<div *ngIf="error"...>`:
```html
<div class="form-group">
    <label for="confirmPassword">Confirmar Contraseña</label>
    <input type="password" id="confirmPassword" formControlName="confirmPassword" placeholder="Repite tu contraseña">
    <span class="error-msg" *ngIf="confirmTouched && !passwordsMatch">
        <small>Las contraseñas no coinciden</small>
    </span>
</div>
```

- [ ] **Step 4: Verificar en navegador**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
npm run frontend
```
Abrir `http://localhost:4200/auth/register`.

Checklist manual:
- [ ] Campos visibles: Nombre, Apellido Paterno, Apellido Materno, Correo, Contraseña, Confirmar Contraseña
- [ ] Al escribir en Contraseña aparece el checklist de reglas
- [ ] Las reglas cambian a verde conforme se cumplen
- [ ] Al escribir en Confirmar Contraseña sin coincidir, aparece "Las contraseñas no coinciden"
- [ ] Botón "Registrarse" deshabilitado hasta form válido
- [ ] Funciona en tema oscuro (contraste correcto)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/auth/register/register.component.html
git commit -m "feat(register): add apellidoPaterno/Materno fields, confirmPassword and password strength UI"
```

---

## Task 6: Actualizar panel de administración

**Files:**
- Modify: `frontend/src/app/pages/admin/dashboard/dashboard.component.html:62`
- Modify: `frontend/src/app/pages/admin/users/users.component.html:17,24`

- [ ] **Step 1: Actualizar dashboard — nombre completo del usuario**

Editar `frontend/src/app/pages/admin/dashboard/dashboard.component.html` línea 62 — reemplazar:
```html
<td>{{ user.firstName }} {{ user.lastName }}</td>
```
con:
```html
<td>{{ user.firstName }} {{ user.apellidoPaterno }}</td>
```

- [ ] **Step 2: Actualizar tabla de usuarios — cabecera y celda**

Editar `frontend/src/app/pages/admin/users/users.component.html`:

Línea 17 — reemplazar la cabecera de columna:
```html
<tr><th>Email</th><th>Nombre</th><th>Apellido</th><th>Rol</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr>
```
con:
```html
<tr><th>Email</th><th>Nombre</th><th>Apellido Paterno</th><th>Apellido Materno</th><th>Rol</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr>
```

Línea 24 — reemplazar la celda:
```html
<td>{{ user.lastName }}</td>
```
con:
```html
<td>{{ user.apellidoPaterno }}</td>
<td>{{ user.apellidoMaterno }}</td>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/pages/admin/dashboard/dashboard.component.html
git add frontend/src/app/pages/admin/users/users.component.html
git commit -m "fix(admin): update lastName references to apellidoPaterno/Materno"
```

---

## Task 7: Actualizar componente de perfil

**Files:**
- Modify: `frontend/src/app/pages/profile/profile.component.ts:32`
- Modify: `frontend/src/app/pages/profile/profile.component.html:17-20`

- [ ] **Step 1: Actualizar el FormGroup en `profile.component.ts`**

Reemplazar:
```typescript
this.profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
});
```
con:
```typescript
this.profileForm = this.fb.group({
    firstName:       ['', Validators.required],
    apellidoPaterno: ['', Validators.required],
    apellidoMaterno: ['', Validators.required],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
});
```

- [ ] **Step 2: Actualizar el template en `profile.component.html`**

Reemplazar el bloque del campo Apellido:
```html
<div class="form-group col">
    <label>Apellido</label>
    <input type="text" formControlName="lastName">
</div>
```
con:
```html
<div class="form-group col">
    <label>Apellido Paterno</label>
    <input type="text" formControlName="apellidoPaterno">
</div>
```

Y agregar después del bloque `.row` que contiene Nombre y Apellido Paterno:
```html
<div class="form-group">
    <label>Apellido Materno</label>
    <input type="text" formControlName="apellidoMaterno">
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/pages/profile/profile.component.ts
git add frontend/src/app/pages/profile/profile.component.html
git commit -m "fix(profile): update lastName field to apellidoPaterno + apellidoMaterno"
```

---

## Task 8: Agregar estilos para el indicador de contraseña

**Files:**
- Modify: `frontend/src/app/pages/auth/login/login.component.scss`

> `register.component.scss` importa este archivo con `@import '../login/login.component.scss'`, por lo que los estilos aplican a ambos componentes.

- [ ] **Step 1: Agregar estilos al final de `login.component.scss`**

```scss
// ── Password strength indicator ───────────────────────────────────────────

.password-rules {
  list-style: none;
  padding: 8px 0 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  li {
    font-size: 0.78rem;
    transition: color var(--transition-fast);
  }
}

.rule-ok   { color: #2e7d32; }
.rule-fail { color: var(--text-secondary); }
```

- [ ] **Step 2: Verificar en navegador con tema oscuro**

Cambiar al tema oscuro (icono de luna en el header).
- [ ] El indicador de contraseña es legible en tema oscuro
- [ ] `rule-ok` verde visible en ambos temas
- [ ] `rule-fail` usa `--text-secondary` (`#aaaaaa` en dark mode — legible)

- [ ] **Step 3: Commit final**

```bash
git add frontend/src/app/pages/auth/login/login.component.scss
git commit -m "feat(register): add password strength indicator styles"
```
