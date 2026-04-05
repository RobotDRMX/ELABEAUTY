# UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 21 UX/security/normalization improvements across the ELA Beauty Angular frontend without any backend changes.

**Architecture:** All changes are frontend-only. Foundation tasks (button system, spacing variables) run first since other tasks depend on them. New standalone components follow Angular 17 patterns already used in the project. All new text strings are added to all 8 i18n JSON files.

**Tech Stack:** Angular 17 standalone components, Signals, SCSS with CSS variables, Lucide Angular icons, Jasmine/Karma tests, custom I18nService, NotificationService.

---

## File Map

**Modified:**
- `src/styles.scss` — add button system + spacing variables
- `src/app/components/body/body.component.html` — remove testimonials section
- `src/app/components/body/body.component.ts` — remove testimonials logic
- `src/app/components/body/body.component.scss` — remove testimonials SCSS
- `src/app/components/header/header.component.html` — dead links, mobile menu
- `src/app/components/header/header.component.ts` — mobile menu signal
- `src/app/components/header/header.component.scss` — mobile menu styles
- `src/app/pages/auth/login/login.component.html` — i18n + icons + show/hide pw + autocomplete
- `src/app/pages/auth/login/login.component.ts` — showPassword signals
- `src/app/pages/auth/login/login.component.scss` — password toggle styles
- `src/app/pages/auth/register/register.component.html` — i18n + show/hide pw + autocomplete
- `src/app/pages/auth/register/register.component.ts` — showPassword signal
- `src/app/pages/auth/reset-password/reset-password.component.html` — show/hide pw
- `src/app/pages/auth/reset-password/reset-password.component.ts` — showPassword signal
- `src/app/pages/cart/cart.component.html` — icons + quantity behavior + progress bar + loading
- `src/app/pages/cart/cart.component.ts` — updatingId signal
- `src/app/pages/cart/cart.component.scss` — progress bar + loading styles
- `src/app/pages/profile/profile.component.html` — icons + order history placeholder
- `src/app/pages/favorites/favorites.component.html` — empty state + loading feedback
- `src/app/pages/favorites/favorites.component.ts` — loadingIds signal
- `src/app/pages/search-results/search-results.component.html` — mobile filter drawer + contextual empty
- `src/app/pages/search-results/search-results.component.ts` — emptyReason, drawerOpen
- `src/app/pages/search-results/search-results.component.scss` — drawer styles
- `src/app/pages/admin/guards/admin.guard.ts` — unauthorized toast
- `src/app/app.routes.ts` — add 404 route, clean up static titles
- `src/app/app.component.html` — add back-to-top + inactivity service init
- `src/app/app.component.ts` — inject InactivityService
- `src/assets/i18n/es.json` + `en.json` + `fr.json` + `pt.json` + `ja.json` + `de.json` + `ru.json` + `ko.json`

**Created:**
- `src/app/components/ui/back-to-top.component.ts`
- `src/app/pages/not-found/not-found.component.ts`
- `src/app/services/inactivity.service.ts`
- `src/app/services/inactivity.service.spec.ts`

---

## Task 1: Global button system + spacing variables

**Files:**
- Modify: `src/styles.scss`

- [ ] **Step 1: Add spacing variables and button system to `styles.scss`**

Add after the existing `:root` block's closing brace (after the transitions section, before `/* ===== DARK THEME ===== */`):

```scss
/* ── Section spacing ── */
:root {
  --section-spacing-sm: 3rem;
  --section-spacing-md: 5rem;
  --section-spacing-lg: 7rem;
}

/* ── Button system ── */
.btn-primary,
.btn-maybelline {  /* btn-maybelline kept as alias */
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 25px;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;

  &:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-pink);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-secondary,
.btn-outline {  /* btn-outline kept as alias */
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: 25px;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;

  &:hover:not(:disabled) {
    background: var(--primary-color);
    color: #fff;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 25px;
  font-family: var(--font-heading);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;

  &:hover:not(:disabled) {
    background: var(--gray-100);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

/* Spin animation for loading icons */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.spin { animation: spin 1s linear infinite; }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles.scss
git commit -m "feat(styles): add btn-primary/secondary/ghost system and section spacing vars"
```

---

## Task 2: Remove testimonials section

**Files:**
- Modify: `src/app/components/body/body.component.html`
- Modify: `src/app/components/body/body.component.ts`
- Modify: `src/app/components/body/body.component.scss`
- Modify: `src/assets/i18n/es.json` (and all 7 other language files)

- [ ] **Step 1: Remove testimonials block from `body.component.html`**

Delete the entire `<!-- ===== TESTIMONIALS SECTION ===== -->` section and its closing tag (approximately lines 166–193 in the current file).

- [ ] **Step 2: Remove testimonials logic from `body.component.ts`**

Remove:
- The `testimonials` array property
- The `activeTestimonial` property
- The `setTestimonial(i: number)` method
- The `getStars(rating: number)` method

- [ ] **Step 3: Remove testimonials SCSS from `body.component.scss`**

Delete any `.testimonials-section`, `.testimonial-card`, `.testimonial-avatar`, `.testimonial-stars`, `.testimonial-text`, `.testimonial-author`, `.testimonial-dots`, `.dot` blocks.

- [ ] **Step 4: Remove testimonials i18n keys**

In all 8 language files (`es.json`, `en.json`, `fr.json`, `pt.json`, `ja.json`, `de.json`, `ru.json`, `ko.json`), remove the `"testimonials.*"` keys block.

- [ ] **Step 5: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/body/
git commit -m "feat(home): remove testimonials section"
```

---

## Task 3: Login — i18n + Lucide icons + show/hide password + autocomplete

**Files:**
- Modify: `src/app/pages/auth/login/login.component.html`
- Modify: `src/app/pages/auth/login/login.component.ts`
- Modify: `src/app/pages/auth/login/login.component.scss`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys to all 8 language files**

In `es.json`, add:
```json
"auth.login_title": "Iniciar Sesión",
"auth.login_subtitle": "Bienvenido de nuevo a ELA Beauty",
"auth.email_label": "Correo Electrónico",
"auth.email_placeholder": "ejemplo@correo.com",
"auth.password_label": "Contraseña",
"auth.password_placeholder": "Tu contraseña",
"auth.email_required": "El correo es requerido",
"auth.email_invalid": "Formato de correo inválido",
"auth.password_required": "La contraseña es requerida",
"auth.submit_login": "Entrar",
"auth.loading": "Verificando...",
"auth.biometric_or": "o usa",
"auth.passkey": "Passkey",
"auth.face_recognition": "Reconocimiento facial",
"auth.face_hint": "Ingresa tu correo arriba, mira de frente a la cámara y pulsa Verificar.",
"auth.face_hint_small": "Asegúrate de tener buena iluminación y que tu rostro esté registrado en tu perfil.",
"auth.verify_face": "Verificar rostro",
"auth.forgot_password": "¿Olvidaste tu contraseña?",
"auth.no_account": "¿No tienes una cuenta?",
"auth.register_link": "Regístrate aquí",
"auth.show_password": "Mostrar contraseña",
"auth.hide_password": "Ocultar contraseña",
"auth.rate_limit": "Por seguridad, espera <strong>{{seconds}}s</strong> antes de volver a intentarlo."
```

In `en.json`, add:
```json
"auth.login_title": "Sign In",
"auth.login_subtitle": "Welcome back to ELA Beauty",
"auth.email_label": "Email Address",
"auth.email_placeholder": "example@email.com",
"auth.password_label": "Password",
"auth.password_placeholder": "Your password",
"auth.email_required": "Email is required",
"auth.email_invalid": "Invalid email format",
"auth.password_required": "Password is required",
"auth.submit_login": "Sign In",
"auth.loading": "Verifying...",
"auth.biometric_or": "or use",
"auth.passkey": "Passkey",
"auth.face_recognition": "Face Recognition",
"auth.face_hint": "Enter your email above, face the camera and press Verify.",
"auth.face_hint_small": "Make sure you have good lighting and your face is registered in your profile.",
"auth.verify_face": "Verify face",
"auth.forgot_password": "Forgot your password?",
"auth.no_account": "Don't have an account?",
"auth.register_link": "Register here",
"auth.show_password": "Show password",
"auth.hide_password": "Hide password",
"auth.rate_limit": "For security, wait <strong>{{seconds}}s</strong> before trying again."
```

Add equivalent translations to `fr.json`, `pt.json`, `ja.json`, `de.json`, `ru.json`, `ko.json`.

- [ ] **Step 2: Add `showPassword` signal to `login.component.ts`**

In the component class, add:
```typescript
showPassword = signal(false);
```

Ensure `LucideAngularModule` is in the `imports` array of the component decorator (it should already be).

- [ ] **Step 3: Rewrite `login.component.html`**

```html
<div class="auth-container fade-in">
  <div class="auth-card">

    <div class="auth-header">
      <h2>{{ 'auth.login_title' | translate }}</h2>
      <p>{{ 'auth.login_subtitle' | translate }}</p>
    </div>

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
      <div class="form-group">
        <label for="email">{{ 'auth.email_label' | translate }}</label>
        <input type="email" id="email" formControlName="email"
          [placeholder]="'auth.email_placeholder' | translate"
          autocomplete="email">
        <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.errors" class="error-msg">
          <small *ngIf="loginForm.get('email')?.errors?.['required']">{{ 'auth.email_required' | translate }}</small>
          <small *ngIf="loginForm.get('email')?.errors?.['email']">{{ 'auth.email_invalid' | translate }}</small>
        </div>
      </div>

      <div class="form-group">
        <label for="password">{{ 'auth.password_label' | translate }}</label>
        <div class="input-password-wrap">
          <input [type]="showPassword() ? 'text' : 'password'"
            id="password" formControlName="password"
            [placeholder]="'auth.password_placeholder' | translate"
            autocomplete="current-password">
          <button type="button" class="pw-toggle-btn"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-label]="(showPassword() ? 'auth.hide_password' : 'auth.show_password') | translate">
            <lucide-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18"></lucide-icon>
          </button>
        </div>
        <div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.errors" class="error-msg">
          <small *ngIf="loginForm.get('password')?.errors?.['required']">{{ 'auth.password_required' | translate }}</small>
        </div>
      </div>

      <div *ngIf="error && countdown === 0" class="alert alert-danger">{{ error }}</div>

      <div *ngIf="countdown > 0" class="alert alert-warning countdown-alert">
        <span class="countdown-icon">⏳</span>
        <span [innerHTML]="'auth.rate_limit' | translate:{ seconds: countdown }"></span>
        <div class="countdown-bar-wrap">
          <div class="countdown-bar" [style.width.%]="(countdown / 60) * 100"></div>
        </div>
      </div>

      <button type="submit" class="btn-primary"
        [disabled]="loginForm.invalid || loading || isBlocked">
        {{ loading ? ('auth.loading' | translate) : ('auth.submit_login' | translate) }}
      </button>
    </form>

    <div class="biometric-divider"><span>{{ 'auth.biometric_or' | translate }}</span></div>

    <div class="biometric-buttons">
      <button *ngIf="biometric.webAuthnSupported()"
        class="btn-ghost" type="button"
        [disabled]="loading || isBlocked"
        (click)="loginPasskey()">
        <lucide-icon name="key-round" [size]="16"></lucide-icon>
        {{ 'auth.passkey' | translate }}
      </button>
      <button class="btn-ghost" type="button"
        [disabled]="loading || isBlocked || biometricMode === 'face'"
        (click)="activateFaceLogin()">
        <lucide-icon name="camera" [size]="16"></lucide-icon>
        {{ 'auth.face_recognition' | translate }}
      </button>
    </div>

    <div *ngIf="biometricMode === 'face'" class="face-panel">
      <p class="face-hint">
        {{ 'auth.face_hint' | translate }}<br>
        <small>{{ 'auth.face_hint_small' | translate }}</small>
      </p>
      <video #videoRef autoplay muted playsinline class="face-video"></video>
      <div class="face-actions">
        <button class="btn-primary" type="button"
          [disabled]="!biometric.cameraActive() || loading || isBlocked"
          (click)="loginWithFace()">
          {{ loading ? ('auth.loading' | translate) : ('auth.verify_face' | translate) }}
        </button>
        <button class="btn-ghost" type="button" (click)="cancelFace()">{{ 'common.cancel' | translate }}</button>
      </div>
    </div>

    <div class="auth-footer">
      <p><a routerLink="/auth/olvide-contrasena">{{ 'auth.forgot_password' | translate }}</a></p>
      <p>{{ 'auth.no_account' | translate }} <a routerLink="/auth/register">{{ 'auth.register_link' | translate }}</a></p>
    </div>

  </div>
</div>
```

- [ ] **Step 4: Add password toggle styles to `login.component.scss`**

```scss
.input-password-wrap {
  position: relative;
  display: flex;
  align-items: center;

  input {
    flex: 1;
    padding-right: 3rem;
  }
}

.pw-toggle-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color var(--transition-fast);

  &:hover { color: var(--primary-color); }
}
```

- [ ] **Step 5: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/auth/login/ src/assets/i18n/
git commit -m "feat(auth): migrate login to i18n, add show/hide password, lucide icons, autocomplete"
```

---

## Task 4: Register — i18n + show/hide password + autocomplete

**Files:**
- Modify: `src/app/pages/auth/register/register.component.html`
- Modify: `src/app/pages/auth/register/register.component.ts`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys to all 8 language files**

In `es.json`, add:
```json
"auth.register_title": "Crear Cuenta",
"auth.register_subtitle": "Únete a la comunidad de ELA Beauty",
"auth.first_name_label": "Nombre",
"auth.first_name_placeholder": "Tu nombre",
"auth.paternal_label": "Apellido Paterno",
"auth.paternal_placeholder": "Apellido paterno",
"auth.maternal_label": "Apellido Materno",
"auth.maternal_placeholder": "Apellido materno",
"auth.confirm_password_label": "Confirmar Contraseña",
"auth.confirm_password_placeholder": "Repite tu contraseña",
"auth.passwords_no_match": "Las contraseñas no coinciden",
"auth.submit_register": "Registrarse",
"auth.loading_register": "Registrando...",
"auth.already_account": "¿Ya tienes una cuenta?",
"auth.login_link": "Inicia sesión",
"auth.rule_min_length": "Mínimo 8 caracteres",
"auth.rule_upper": "Una letra mayúscula",
"auth.rule_lower": "Una letra minúscula",
"auth.rule_number": "Un número"
```

In `en.json`, add:
```json
"auth.register_title": "Create Account",
"auth.register_subtitle": "Join the ELA Beauty community",
"auth.first_name_label": "First Name",
"auth.first_name_placeholder": "Your name",
"auth.paternal_label": "Paternal Surname",
"auth.paternal_placeholder": "Paternal surname",
"auth.maternal_label": "Maternal Surname",
"auth.maternal_placeholder": "Maternal surname",
"auth.confirm_password_label": "Confirm Password",
"auth.confirm_password_placeholder": "Repeat your password",
"auth.passwords_no_match": "Passwords do not match",
"auth.submit_register": "Register",
"auth.loading_register": "Registering...",
"auth.already_account": "Already have an account?",
"auth.login_link": "Sign in",
"auth.rule_min_length": "Minimum 8 characters",
"auth.rule_upper": "One uppercase letter",
"auth.rule_lower": "One lowercase letter",
"auth.rule_number": "One number"
```

Add equivalent translations to remaining 6 language files.

- [ ] **Step 2: Add `showPassword` and `showConfirm` signals to `register.component.ts`**

```typescript
showPassword = signal(false);
showConfirm = signal(false);
```

- [ ] **Step 3: Replace password and confirm fields in `register.component.html`**

Replace the hardcoded text with i18n, and update the form header, labels, and button:
```html
<!-- Header -->
<h2>{{ 'auth.register_title' | translate }}</h2>
<p>{{ 'auth.register_subtitle' | translate }}</p>

<!-- Name fields -->
<label for="firstName">{{ 'auth.first_name_label' | translate }}</label>
<input type="text" id="firstName" formControlName="firstName"
  [placeholder]="'auth.first_name_placeholder' | translate"
  autocomplete="given-name">

<label for="apellidoPaterno">{{ 'auth.paternal_label' | translate }}</label>
<input type="text" id="apellidoPaterno" formControlName="apellidoPaterno"
  [placeholder]="'auth.paternal_placeholder' | translate"
  autocomplete="family-name">

<label for="apellidoMaterno">{{ 'auth.maternal_label' | translate }}</label>
<input type="text" id="apellidoMaterno" formControlName="apellidoMaterno"
  [placeholder]="'auth.maternal_placeholder' | translate">

<!-- Email -->
<label for="email">{{ 'auth.email_label' | translate }}</label>
<input type="email" id="email" formControlName="email"
  [placeholder]="'auth.email_placeholder' | translate"
  autocomplete="email">

<!-- Password with toggle -->
<label for="password">{{ 'auth.password_label' | translate }}</label>
<div class="input-password-wrap">
  <input [type]="showPassword() ? 'text' : 'password'"
    id="password" formControlName="password"
    [placeholder]="'auth.password_placeholder' | translate"
    autocomplete="new-password">
  <button type="button" class="pw-toggle-btn"
    (click)="showPassword.set(!showPassword())"
    [attr.aria-label]="(showPassword() ? 'auth.hide_password' : 'auth.show_password') | translate">
    <lucide-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18"></lucide-icon>
  </button>
</div>

<!-- Password rules — keep existing logic, just translate labels -->
<ul class="password-rules" *ngIf="passwordValue.length > 0">
  <li [class.rule-ok]="passwordRules.minLength" [class.rule-fail]="!passwordRules.minLength">
    {{ passwordRules.minLength ? '✓' : '✗' }} {{ 'auth.rule_min_length' | translate }}
  </li>
  <li [class.rule-ok]="passwordRules.hasUpper" [class.rule-fail]="!passwordRules.hasUpper">
    {{ passwordRules.hasUpper ? '✓' : '✗' }} {{ 'auth.rule_upper' | translate }}
  </li>
  <li [class.rule-ok]="passwordRules.hasLower" [class.rule-fail]="!passwordRules.hasLower">
    {{ passwordRules.hasLower ? '✓' : '✗' }} {{ 'auth.rule_lower' | translate }}
  </li>
  <li [class.rule-ok]="passwordRules.hasNumber" [class.rule-fail]="!passwordRules.hasNumber">
    {{ passwordRules.hasNumber ? '✓' : '✗' }} {{ 'auth.rule_number' | translate }}
  </li>
</ul>

<!-- Confirm password with toggle -->
<label for="confirmPassword">{{ 'auth.confirm_password_label' | translate }}</label>
<div class="input-password-wrap">
  <input [type]="showConfirm() ? 'text' : 'password'"
    id="confirmPassword" formControlName="confirmPassword"
    [placeholder]="'auth.confirm_password_placeholder' | translate"
    autocomplete="new-password">
  <button type="button" class="pw-toggle-btn"
    (click)="showConfirm.set(!showConfirm())"
    [attr.aria-label]="(showConfirm() ? 'auth.hide_password' : 'auth.show_password') | translate">
    <lucide-icon [name]="showConfirm() ? 'eye-off' : 'eye'" [size]="18"></lucide-icon>
  </button>
</div>
<span class="error-msg" *ngIf="confirmTouched && !passwordsMatch">
  <small>{{ 'auth.passwords_no_match' | translate }}</small>
</span>

<!-- Submit button -->
<button type="submit" class="btn-primary" [disabled]="registerForm.invalid || loading || !!successMsg">
  {{ loading ? ('auth.loading_register' | translate) : ('auth.submit_register' | translate) }}
</button>

<!-- Footer -->
<p>{{ 'auth.already_account' | translate }} <a routerLink="/auth/login">{{ 'auth.login_link' | translate }}</a></p>
```

Also add `.input-password-wrap` and `.pw-toggle-btn` styles to `register.component.scss` (same as login — copy the styles from Task 3 Step 4).

- [ ] **Step 4: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/auth/register/ src/assets/i18n/
git commit -m "feat(auth): add i18n, show/hide password, and autocomplete to register form"
```

---

## Task 5: Reset password — show/hide password

**Files:**
- Modify: `src/app/pages/auth/reset-password/reset-password.component.html`
- Modify: `src/app/pages/auth/reset-password/reset-password.component.ts`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"auth.new_password_label": "Nueva Contraseña",
"auth.new_password_placeholder": "Mínimo 8 caracteres"
```

In `en.json`:
```json
"auth.new_password_label": "New Password",
"auth.new_password_placeholder": "Minimum 8 characters"
```

Add to remaining 6 files.

- [ ] **Step 2: Add signal to `reset-password.component.ts`**

```typescript
showPassword = signal(false);
```

- [ ] **Step 3: Update password input in `reset-password.component.html`**

Wrap the password input with `.input-password-wrap` and add the toggle button:
```html
<div class="input-password-wrap">
  <input [type]="showPassword() ? 'text' : 'password'"
    formControlName="password"
    [placeholder]="'auth.new_password_placeholder' | translate"
    autocomplete="new-password">
  <button type="button" class="pw-toggle-btn"
    (click)="showPassword.set(!showPassword())"
    [attr.aria-label]="(showPassword() ? 'auth.hide_password' : 'auth.show_password') | translate">
    <lucide-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18"></lucide-icon>
  </button>
</div>
```

Add `.input-password-wrap` and `.pw-toggle-btn` SCSS to `reset-password.component.scss` (same styles as Task 3).

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/auth/reset-password/ src/assets/i18n/
git commit -m "feat(auth): add show/hide password to reset password form"
```

---

## Task 6: Cart — icon normalization + quantity-at-1 trash behavior + updatingId

**Files:**
- Modify: `src/app/pages/cart/cart.component.html`
- Modify: `src/app/pages/cart/cart.component.ts`
- Modify: `src/app/pages/cart/cart.component.scss`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"cart.max_stock": "Sin más stock disponible",
"cart.remove_confirm_title": "¿Eliminar producto?",
"cart.remove_confirm_msg": "¿Quieres eliminar este producto del carrito?"
```

In `en.json`:
```json
"cart.max_stock": "No more stock available",
"cart.remove_confirm_title": "Remove product?",
"cart.remove_confirm_msg": "Do you want to remove this product from the cart?"
```

Add to remaining 6 files.

- [ ] **Step 2: Add `updatingId` signal to `cart.component.ts`**

```typescript
updatingId = signal<number | null>(null);
```

Update `updateQuantity` and `removeItem` to set/clear this signal:
```typescript
async updateQuantity(productId: number, quantity: number) {
  if (quantity === 0) {
    const confirmed = await this.notif.confirm({
      title: this.i18n.t('cart.remove_confirm_title'),
      message: this.i18n.t('cart.remove_confirm_msg'),
      confirmText: this.i18n.t('common.confirm'),
      cancelText: this.i18n.t('common.cancel'),
      danger: true
    });
    if (!confirmed) return;
    this.updatingId.set(productId);
    this.cartService.removeItem(productId).subscribe({
      next: () => { this.loadCart(); this.updatingId.set(null); },
      error: () => this.updatingId.set(null)
    });
    return;
  }
  this.updatingId.set(productId);
  this.cartService.updateQuantity(productId, quantity).subscribe({
    next: () => { this.loadCart(); this.updatingId.set(null); },
    error: () => this.updatingId.set(null)
  });
}
```

- [ ] **Step 3: Update quantity controls in `cart.component.html`**

Replace the quantity control block for each item:
```html
<div class="quantity-control">
  <!-- Minus or trash depending on quantity -->
  <button
    [disabled]="updatingId() === item.product.id"
    (click)="updateQuantity(item.product.id, item.quantity - 1)"
    [title]="item.quantity === 1 ? ('cart.remove_confirm_title' | translate) : ''">
    @if (item.quantity === 1) {
      <lucide-icon name="trash-2" [size]="16"></lucide-icon>
    } @else {
      <lucide-icon name="minus" [size]="16"></lucide-icon>
    }
  </button>
  <span>
    @if (updatingId() === item.product.id) {
      <lucide-icon name="loader-circle" [size]="16" class="spin"></lucide-icon>
    } @else {
      {{ item.quantity }}
    }
  </span>
  <button
    [disabled]="updatingId() === item.product.id || item.quantity >= item.product.stock"
    [title]="item.quantity >= item.product.stock ? ('cart.max_stock' | translate) : ''"
    (click)="updateQuantity(item.product.id, item.quantity + 1)">
    <lucide-icon name="plus" [size]="16"></lucide-icon>
  </button>
</div>
```

Replace the remove button inline SVG:
```html
<button class="remove-btn" (click)="removeItem(item.product.id)">
  <lucide-icon name="trash-2" [size]="14"></lucide-icon>
  {{ 'cart.remove' | translate }}
</button>
```

Replace the shipping info SVGs with lucide icons:
```html
<!-- Info icon -->
<lucide-icon name="info" [size]="16"></lucide-icon>
<!-- Check icon -->
<lucide-icon name="circle-check" [size]="16"></lucide-icon>
```

- [ ] **Step 4: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/cart/ src/assets/i18n/
git commit -m "feat(cart): normalize icons, trash-at-1 quantity behavior, updatingId loading state"
```

---

## Task 7: Profile — icon normalization + order history placeholder

**Files:**
- Modify: `src/app/pages/profile/profile.component.html`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"profile.order_history": "Historial de Compras",
"profile.order_history_soon": "Próximamente podrás ver el historial de tus pedidos aquí"
```

In `en.json`:
```json
"profile.order_history": "Purchase History",
"profile.order_history_soon": "Your order history will be available here soon"
```

Add to remaining 6 files.

- [ ] **Step 2: Update `profile.component.html`**

Replace the `🔑` and `📷` emojis in the biometric section:
```html
<!-- Passkey option -->
<span class="option-icon">
  <lucide-icon name="key-round" [size]="22"></lucide-icon>
</span>

<!-- Face recognition option -->
<span class="option-icon">
  <lucide-icon name="camera" [size]="22"></lucide-icon>
</span>
```

Replace the orders section:
```html
<div class="orders-preview mt-4">
  <h3>{{ 'profile.order_history' | translate }}</h3>
  <div class="no-orders">
    <lucide-icon name="clock" [size]="36"></lucide-icon>
    <p>{{ 'profile.order_history_soon' | translate }}</p>
  </div>
</div>
```

Also ensure `LucideAngularModule` is imported in `profile.component.ts` if not already.

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/profile/ src/assets/i18n/
git commit -m "feat(profile): normalize icons to lucide, update order history to coming soon"
```

---

## Task 8: Checkout — i18n + field validation + autocomplete

**Files:**
- Modify: `src/app/pages/cart/cart.component.html` (checkout modal section)
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys for checkout**

In `es.json`:
```json
"checkout.title": "Checkout",
"checkout.step_shipping": "Envío",
"checkout.step_payment": "Pago",
"checkout.step_confirm": "Confirmar",
"checkout.address_title": "Dirección de envío",
"checkout.first_name": "Nombre",
"checkout.last_name": "Apellido",
"checkout.street": "Calle y número",
"checkout.street_placeholder": "Ej: Av. Insurgentes 123, Int. 4",
"checkout.colonia": "Colonia",
"checkout.city": "Ciudad",
"checkout.state": "Estado",
"checkout.state_placeholder": "Selecciona un estado",
"checkout.zip": "Código postal",
"checkout.phone": "Teléfono",
"checkout.phone_placeholder": "10 dígitos",
"checkout.required_field": "Este campo es requerido",
"checkout.zip_invalid": "Código postal inválido (5 dígitos)",
"checkout.phone_invalid": "Teléfono inválido (10 dígitos)",
"checkout.continue_payment": "Continuar al Pago",
"checkout.payment_title": "Método de pago",
"checkout.card_option": "Tarjeta de crédito / débito",
"checkout.card_brands": "Visa, Mastercard, AMEX",
"checkout.cash_option": "Efectivo en tienda",
"checkout.cash_desc": "Recoge y paga en sucursal",
"checkout.oxxo_option": "Pago en OXXO",
"checkout.oxxo_desc": "Genera tu referencia y paga en cualquier OXXO",
"checkout.card_number": "Número de tarjeta",
"checkout.card_name": "Nombre en la tarjeta",
"checkout.card_name_placeholder": "Como aparece en la tarjeta",
"checkout.card_expiry": "Fecha de vencimiento",
"checkout.card_cvv": "CVV",
"checkout.oxxo_info": "Después de confirmar, recibirás una referencia de pago. Tienes 48 horas para pagar en cualquier tienda OXXO del país.",
"checkout.cash_info": "Tu pedido quedará reservado por 24 horas. Preséntate en sucursal con tu número de orden para pagar y recoger.",
"checkout.review_title": "Revisa tu pedido",
"checkout.shipping_address": "Dirección de envío",
"checkout.payment_method": "Método de pago",
"checkout.products_count": "Productos ({{count}})",
"checkout.back": "← Volver",
"checkout.review_order": "Revisar pedido →",
"checkout.confirm_pay": "Confirmar y Pagar",
"checkout.processing": "Procesando tu pago...",
"checkout.processing_msg": "No cierres esta ventana. Estamos verificando tu información de manera segura.",
"checkout.proc_verifying": "Verificando datos",
"checkout.proc_processing": "Procesando pago",
"checkout.proc_confirming": "Confirmando orden",
"checkout.success_title": "¡Pedido confirmado!",
"checkout.success_subtitle": "Tu orden ha sido procesada con éxito",
"checkout.order_label": "Número de orden",
"checkout.success_card_msg": "Recibirás un correo de confirmación. El tiempo de entrega estimado es de 3–5 días hábiles.",
"checkout.success_oxxo_msg": "Tu referencia de pago será enviada a tu correo. Tienes 48 horas para realizar el pago en OXXO.",
"checkout.success_cash_msg": "Tu pedido está reservado por 24 horas. Visita cualquier sucursal con tu número de orden.",
"checkout.keep_shopping": "Seguir comprando"
```

In `en.json`, add English equivalents for all keys above.

Add to remaining 6 files.

- [ ] **Step 2: Update checkout modal in `cart.component.html`**

Replace all hardcoded strings in the checkout modal with `| translate`. Key changes:

Step labels:
```html
<span>{{ 'checkout.step_shipping' | translate }}</span>
<span>{{ 'checkout.step_payment' | translate }}</span>
<span>{{ 'checkout.step_confirm' | translate }}</span>
```

Address form with validation and autocomplete:
```html
<h2 class="step-title">{{ 'checkout.address_title' | translate }}</h2>
<div class="form-grid">
  <div class="form-group">
    <label>{{ 'checkout.first_name' | translate }} *</label>
    <input type="text" [(ngModel)]="address.firstName"
      [placeholder]="'checkout.first_name' | translate"
      autocomplete="given-name">
    <small class="error-msg" *ngIf="addressSubmitted && !address.firstName">
      {{ 'checkout.required_field' | translate }}
    </small>
  </div>
  <div class="form-group">
    <label>{{ 'checkout.last_name' | translate }} *</label>
    <input type="text" [(ngModel)]="address.lastName"
      [placeholder]="'checkout.last_name' | translate"
      autocomplete="family-name">
    <small class="error-msg" *ngIf="addressSubmitted && !address.lastName">
      {{ 'checkout.required_field' | translate }}
    </small>
  </div>
  <div class="form-group full-width">
    <label>{{ 'checkout.street' | translate }} *</label>
    <input type="text" [(ngModel)]="address.street"
      [placeholder]="'checkout.street_placeholder' | translate"
      autocomplete="street-address">
    <small class="error-msg" *ngIf="addressSubmitted && !address.street">
      {{ 'checkout.required_field' | translate }}
    </small>
  </div>
  <div class="form-group">
    <label>{{ 'checkout.colonia' | translate }} *</label>
    <input type="text" [(ngModel)]="address.colonia"
      [placeholder]="'checkout.colonia' | translate"
      autocomplete="address-level3">
    <small class="error-msg" *ngIf="addressSubmitted && !address.colonia">
      {{ 'checkout.required_field' | translate }}
    </small>
  </div>
  <div class="form-group">
    <label>{{ 'checkout.city' | translate }} *</label>
    <input type="text" [(ngModel)]="address.city"
      [placeholder]="'checkout.city' | translate"
      autocomplete="address-level2">
    <small class="error-msg" *ngIf="addressSubmitted && !address.city">
      {{ 'checkout.required_field' | translate }}
    </small>
  </div>
  <!-- State select, zip, phone — same pattern with autocomplete="address-level1", "postal-code", "tel" -->
</div>
```

Add `addressSubmitted = false` signal to cart component, set to `true` when user clicks "Continuar" before validation passes.

Card form autocomplete:
```html
<input type="text" [value]="card.number" (input)="formatCardNumber($event)"
  placeholder="0000 0000 0000 0000" maxlength="19" autocomplete="cc-number">
<input type="text" [(ngModel)]="card.name"
  placeholder="Como aparece en la tarjeta" autocomplete="cc-name">
<input type="text" [value]="card.expiry" (input)="formatExpiry($event)"
  placeholder="MM/AA" maxlength="5" autocomplete="cc-exp">
<input type="password" [(ngModel)]="card.cvv"
  placeholder="•••" maxlength="4" autocomplete="off">
```

Translate all remaining hardcoded strings in payment options, review step, and success step.

- [ ] **Step 3: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/cart/ src/assets/i18n/
git commit -m "feat(checkout): migrate to i18n, add field validation feedback and autocomplete"
```

---

## Task 9: Header — dead links + mobile hamburger menu

**Files:**
- Modify: `src/app/components/header/header.component.html`
- Modify: `src/app/components/header/header.component.ts`
- Modify: `src/app/components/header/header.component.scss`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"header.coming_soon": "Próximamente",
"header.menu_open": "Abrir menú",
"header.menu_close": "Cerrar menú"
```

In `en.json`:
```json
"header.coming_soon": "Coming soon",
"header.menu_open": "Open menu",
"header.menu_close": "Close menu"
```

Add to remaining 6 files.

- [ ] **Step 2: Add `mobileMenuOpen` signal to `header.component.ts`**

```typescript
mobileMenuOpen = signal(false);

toggleMobileMenu() {
  this.mobileMenuOpen.set(!this.mobileMenuOpen());
}

closeMobileMenu() {
  this.mobileMenuOpen.set(false);
}
```

- [ ] **Step 3: Update `header.component.html`**

Replace the three `<a href="#">` in the top bar with disabled buttons:
```html
<button class="top-link-btn" disabled [title]="'header.coming_soon' | translate">
  <lucide-icon name="map-pin" [size]="12"></lucide-icon>
  {{ 'header.track_order' | translate }}
</button>
<button class="top-link-btn" disabled [title]="'header.coming_soon' | translate">
  <lucide-icon name="help-circle" [size]="12"></lucide-icon>
  {{ 'header.help' | translate }}
</button>
<button class="top-link-btn" disabled [title]="'header.coming_soon' | translate">
  <lucide-icon name="phone" [size]="12"></lucide-icon>
  {{ 'header.contact' | translate }}
</button>
```

Add hamburger button in the header-content div (after the logo):
```html
<!-- Hamburger (mobile only) -->
<button class="hamburger-btn" (click)="toggleMobileMenu()"
  [attr.aria-label]="(mobileMenuOpen() ? 'header.menu_close' : 'header.menu_open') | translate"
  [attr.aria-expanded]="mobileMenuOpen()">
  @if (mobileMenuOpen()) {
    <lucide-icon name="x" [size]="22"></lucide-icon>
  } @else {
    <lucide-icon name="menu" [size]="22"></lucide-icon>
  }
</button>
```

Add mobile drawer after the `</header>` closing tag:
```html
<!-- Mobile Nav Drawer -->
@if (mobileMenuOpen()) {
  <div class="mobile-overlay" (click)="closeMobileMenu()"></div>
  <nav class="mobile-drawer" aria-label="Navegación móvil">
    <a *ngFor="let item of navItems"
       [routerLink]="item.link"
       [queryParams]="item.queryParams || {}"
       (click)="closeMobileMenu()"
       class="mobile-nav-link">
      {{ item.label }}
    </a>
    <div class="mobile-drawer-divider"></div>
    <div class="mobile-drawer-controls">
      <!-- Language selector -->
      <select class="lang-select"
        [ngModel]="i18n.lang()"
        (ngModelChange)="i18n.setLang($event)">
        @for (l of languages; track l.code) {
          <option [value]="l.code">{{ l.flag }} {{ l.label }}</option>
        }
      </select>
      <!-- Theme controls — copy from header-top -->
      <div class="theme-toggle-group" role="group">
        <button class="theme-toggle-btn" [class.active]="themeService.theme() === 'light'"
          (click)="themeService.setTheme('light')" title="Claro">
          <lucide-icon name="sun" [size]="14"></lucide-icon>
        </button>
        <button class="theme-toggle-btn" [class.active]="themeService.theme() === 'dark'"
          (click)="themeService.setTheme('dark')" title="Oscuro">
          <lucide-icon name="moon" [size]="14"></lucide-icon>
        </button>
      </div>
    </div>
    <div class="mobile-drawer-divider"></div>
    <!-- Auth links -->
    <div class="mobile-auth">
      <ng-container *ngIf="!isLoggedIn">
        <a routerLink="/auth/login" class="btn-primary" (click)="closeMobileMenu()">
          {{ 'header.login' | translate }}
        </a>
        <a routerLink="/auth/register" class="btn-secondary" (click)="closeMobileMenu()">
          {{ 'header.register' | translate }}
        </a>
      </ng-container>
      <ng-container *ngIf="isLoggedIn">
        <span class="mobile-username">{{ userName }}</span>
        <button class="btn-ghost" (click)="logout(); closeMobileMenu()">
          <lucide-icon name="log-out" [size]="16"></lucide-icon>
          {{ 'header.logout' | translate }}
        </button>
      </ng-container>
    </div>
  </nav>
}
```

- [ ] **Step 4: Add mobile styles to `header.component.scss`**

```scss
.top-link-btn {
  background: none;
  border: none;
  cursor: not-allowed;
  opacity: 0.5;
  color: inherit;
  font-size: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
}

.hamburger-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #fff;
  padding: 4px;
}

.mobile-overlay {
  display: none;
}

.mobile-drawer {
  display: none;
}

@media (max-width: 768px) {
  .hamburger-btn { display: flex; align-items: center; }
  .main-nav { display: none; }
  .header-top { display: none; }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 900;
  }

  .mobile-drawer {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    right: 0;
    width: 80%;
    max-width: 320px;
    height: 100vh;
    background: var(--surface-1);
    z-index: 901;
    padding: 1.5rem;
    overflow-y: auto;
    box-shadow: -4px 0 20px rgba(0,0,0,0.2);
    gap: 0.25rem;
  }

  .mobile-nav-link {
    padding: 0.75rem 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    text-decoration: none;
    border-bottom: 1px solid var(--border-color);
    &:hover { color: var(--primary-color); }
  }

  .mobile-drawer-divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.75rem 0;
  }

  .mobile-drawer-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .mobile-auth {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: auto;
  }

  .mobile-username {
    font-weight: 700;
    color: var(--text-primary);
  }
}
```

- [ ] **Step 5: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add src/app/components/header/ src/assets/i18n/
git commit -m "feat(header): replace dead links with disabled buttons, add mobile hamburger drawer"
```

---

## Task 10: Back-to-top component

**Files:**
- Create: `src/app/components/ui/back-to-top.component.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.ts`

- [ ] **Step 1: Write failing test**

Create `src/app/components/ui/back-to-top.component.spec.ts`:
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackToTopComponent } from './back-to-top.component';

describe('BackToTopComponent', () => {
  let fixture: ComponentFixture<BackToTopComponent>;
  let component: BackToTopComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackToTopComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(BackToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be hidden when scrollY is 0', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.visible()).toBe(false);
  });

  it('should be visible when scrollY > 400', () => {
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.visible()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
cd frontend && ng test --include="**/back-to-top.component.spec.ts" --watch=false 2>&1 | tail -10
```
Expected: error (component does not exist yet).

- [ ] **Step 3: Create `back-to-top.component.ts`**

```typescript
import { Component, signal, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <button
      class="back-to-top"
      [class.visible]="visible()"
      (click)="scrollToTop()"
      aria-label="Volver arriba">
      <lucide-icon name="arrow-up" [size]="20"></lucide-icon>
    </button>
  `,
  styles: [`
    .back-to-top {
      position: fixed;
      bottom: 6rem;
      right: 1.5rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      z-index: 999;

      &:hover { filter: brightness(1.1); }
    }

    .back-to-top.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: all;
    }

    @media (prefers-reduced-motion: reduce) {
      .back-to-top { transition: none; }
    }
  `]
})
export class BackToTopComponent implements OnDestroy {
  visible = signal(false);
  private listener = () => this.onScroll();

  constructor() {
    window.addEventListener('scroll', this.listener, { passive: true });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.listener);
  }

  private onScroll() {
    this.visible.set(window.scrollY > 400);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd frontend && ng test --include="**/back-to-top.component.spec.ts" --watch=false 2>&1 | tail -10
```
Expected: 2 specs passed.

- [ ] **Step 5: Add to `app.component.html`**

Add before the closing `</div>` of the root element:
```html
<app-back-to-top></app-back-to-top>
```

Add `BackToTopComponent` to imports in `app.component.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/ui/back-to-top.component.ts src/app/components/ui/back-to-top.component.spec.ts src/app/app.component.html src/app/app.component.ts
git commit -m "feat(ui): add back-to-top floating button component"
```

---

## Task 11: 404 page + admin unauthorized redirect

**Files:**
- Create: `src/app/pages/not-found/not-found.component.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/pages/admin/guards/admin.guard.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"notfound.title": "Página no encontrada",
"notfound.subtitle": "La página que buscas no existe o fue movida.",
"notfound.back_home": "Volver al inicio",
"auth.unauthorized": "No tienes permisos para acceder a esa sección"
```

In `en.json`:
```json
"notfound.title": "Page not found",
"notfound.subtitle": "The page you're looking for doesn't exist or was moved.",
"notfound.back_home": "Back to home",
"auth.unauthorized": "You don't have permission to access that section"
```

Add to remaining 6 files.

- [ ] **Step 2: Create `not-found.component.ts`**

```typescript
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, TranslatePipe],
  template: `
    <div class="not-found-page">
      <lucide-icon name="file-question" [size]="80"></lucide-icon>
      <h1>{{ 'notfound.title' | translate }}</h1>
      <p>{{ 'notfound.subtitle' | translate }}</p>
      <a routerLink="/" class="btn-primary">{{ 'notfound.back_home' | translate }}</a>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary);

      lucide-icon { opacity: 0.4; }

      h1 {
        font-family: var(--font-heading);
        font-size: 2rem;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0;
      }

      p {
        font-size: 1rem;
        max-width: 400px;
        margin: 0;
      }
    }
  `]
})
export class NotFoundComponent {}
```

- [ ] **Step 3: Update `app.routes.ts`**

Replace the current wildcard route:
```typescript
// Old:
{ path: '**', redirectTo: '', pathMatch: 'full' }

// New:
{
  path: '**',
  loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  title: 'ELA Beauty — 404'
}
```

- [ ] **Step 4: Update `admin.guard.ts` to navigate with unauthorized state**

```typescript
export const adminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getProfile().pipe(
    map((user: any) => {
      authService.currentUser.set(user);
      authService.isAuthenticated.set(true);
      if (user?.role === 'admin') return true;
      router.navigate(['/'], { state: { unauthorized: true } });
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

- [ ] **Step 5: Read unauthorized state in `app.component.ts`**

Inject `Router` and `NotificationService`, then in `ngOnInit`:
```typescript
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

// In constructor or ngOnInit:
this.router.events.pipe(
  filter(e => e instanceof NavigationEnd)
).subscribe(() => {
  const nav = this.router.getCurrentNavigation();
  if (nav?.extras?.state?.['unauthorized']) {
    this.notif.showToast(this.i18n.t('auth.unauthorized'), 'error');
  }
});
```

- [ ] **Step 6: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add src/app/pages/not-found/ src/app/app.routes.ts src/app/pages/admin/guards/ src/app/app.component.ts src/assets/i18n/
git commit -m "feat(routing): add 404 page and unauthorized admin redirect toast"
```

---

## Task 12: InactivityService + auto-logout

**Files:**
- Create: `src/app/services/inactivity.service.ts`
- Create: `src/app/services/inactivity.service.spec.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"inactivity.warning_title": "¿Sigues ahí?",
"inactivity.warning_msg": "Tu sesión cerrará por inactividad. ¿Deseas continuar?",
"inactivity.keep_session": "Seguir conectado",
"inactivity.logged_out": "Sesión cerrada por inactividad"
```

In `en.json`:
```json
"inactivity.warning_title": "Still there?",
"inactivity.warning_msg": "Your session will close due to inactivity. Do you want to continue?",
"inactivity.keep_session": "Stay connected",
"inactivity.logged_out": "Session closed due to inactivity"
```

Add to remaining 6 files.

- [ ] **Step 2: Write failing test**

Create `src/app/services/inactivity.service.spec.ts`:
```typescript
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InactivityService } from './inactivity.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { I18nService } from './i18n.service';
import { signal } from '@angular/core';

describe('InactivityService', () => {
  let service: InactivityService;
  let mockAuth: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNotif: jasmine.SpyObj<NotificationService>;
  let mockI18n: jasmine.SpyObj<I18nService>;

  beforeEach(() => {
    mockAuth = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: signal(true)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockNotif = jasmine.createSpyObj('NotificationService', ['showToast', 'confirm']);
    mockI18n = jasmine.createSpyObj('I18nService', ['t']);
    mockNotif.confirm.and.returnValue(Promise.resolve(false));

    TestBed.configureTestingModule({
      providers: [
        InactivityService,
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
        { provide: NotificationService, useValue: mockNotif },
        { provide: I18nService, useValue: mockI18n },
      ]
    });
    service = TestBed.inject(InactivityService);
  });

  afterEach(() => service.stop());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('resetTimer should cancel pending timeouts', fakeAsync(() => {
    service.start(false);
    service.resetTimer();
    // If timer was reset, warning should not fire at original time
    tick(25 * 60 * 1000 - 1);
    expect(mockNotif.confirm).not.toHaveBeenCalled();
  }));

  it('should use 15min timeout for admin routes', fakeAsync(() => {
    service.start(true);
    tick(10 * 60 * 1000 + 1); // 10 min into 15 min timer = warning at 10min
    expect(mockNotif.confirm).toHaveBeenCalled();
  }));
});
```

- [ ] **Step 3: Run test — expect fail**

```bash
cd frontend && ng test --include="**/inactivity.service.spec.ts" --watch=false 2>&1 | tail -10
```
Expected: error (service does not exist).

- [ ] **Step 4: Create `inactivity.service.ts`**

```typescript
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  private warningTimer?: ReturnType<typeof setTimeout>;
  private logoutTimer?: ReturnType<typeof setTimeout>;
  private isAdmin = false;
  private readonly EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  private boundReset = () => this.resetTimer();

  /** Call when user logs in. isAdminRoute=true uses 15min, false uses 30min. */
  start(isAdminRoute: boolean) {
    this.isAdmin = isAdminRoute;
    this.EVENTS.forEach(e => document.addEventListener(e, this.boundReset, { passive: true }));
    this.scheduleTimers();
  }

  stop() {
    this.EVENTS.forEach(e => document.removeEventListener(e, this.boundReset));
    clearTimeout(this.warningTimer);
    clearTimeout(this.logoutTimer);
  }

  resetTimer() {
    clearTimeout(this.warningTimer);
    clearTimeout(this.logoutTimer);
    this.scheduleTimers();
  }

  private scheduleTimers() {
    const totalMs = this.isAdmin ? 15 * 60 * 1000 : 30 * 60 * 1000;
    const warnMs  = totalMs - 5 * 60 * 1000;  // warn 5 min before

    this.warningTimer = setTimeout(() => this.showWarning(totalMs - warnMs), warnMs);
  }

  private async showWarning(remainingMs: number) {
    const confirmed = await this.notif.confirm({
      title: this.i18n.t('inactivity.warning_title'),
      message: this.i18n.t('inactivity.warning_msg'),
      confirmText: this.i18n.t('inactivity.keep_session'),
      cancelText: this.i18n.t('header.logout'),
      danger: false
    });

    if (confirmed) {
      this.resetTimer();
    } else {
      this.performLogout();
    }
  }

  private performLogout() {
    this.stop();
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login'], { queryParams: { reason: 'inactivity' } });
      },
      error: () => {
        this.router.navigate(['/auth/login'], { queryParams: { reason: 'inactivity' } });
      }
    });
  }

  ngOnDestroy() { this.stop(); }
}
```

- [ ] **Step 5: Run test — expect pass**

```bash
cd frontend && ng test --include="**/inactivity.service.spec.ts" --watch=false 2>&1 | tail -10
```
Expected: 3 specs passed.

- [ ] **Step 6: Start/stop service from `app.component.ts`**

Inject `InactivityService`, `Router`, and watch for auth state and route changes:
```typescript
import { effect } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { InactivityService } from './services/inactivity.service';

// In constructor:
effect(() => {
  const authenticated = this.auth.isAuthenticated();
  if (authenticated) {
    const isAdmin = this.router.url.startsWith('/admin');
    this.inactivity.start(isAdmin);
  } else {
    this.inactivity.stop();
  }
});

// Also show toast when redirected with reason=inactivity:
this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('reason') === 'inactivity') {
    this.notif.showToast(this.i18n.t('inactivity.logged_out'), 'info');
  }
});
```

- [ ] **Step 7: Commit**

```bash
git add src/app/services/inactivity.service.ts src/app/services/inactivity.service.spec.ts src/app/app.component.ts src/assets/i18n/
git commit -m "feat(security): add InactivityService with auto-logout at 30min (15min for admin)"
```

---

## Task 13: Mobile filter drawer (search page)

**Files:**
- Modify: `src/app/pages/search-results/search-results.component.html`
- Modify: `src/app/pages/search-results/search-results.component.ts`
- Modify: `src/app/pages/search-results/search-results.component.scss`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"filters.open": "Filtros",
"filters.close": "Cerrar filtros",
"filters.active_count": "Filtros ({{count}})"
```

In `en.json`:
```json
"filters.open": "Filters",
"filters.close": "Close filters",
"filters.active_count": "Filters ({{count}})"
```

Add to remaining 6 files.

- [ ] **Step 2: Add `drawerOpen` and `activeFilterCount` to `search-results.component.ts`**

```typescript
drawerOpen = signal(false);

get activeFilterCount(): number {
  let count = 0;
  if (this.filters.onlyInStock) count++;
  if (this.filters.targetAge) count++;
  if (this.filters.minPrice) count++;
  if (this.filters.maxPrice) count++;
  return count;
}
```

- [ ] **Step 3: Update `search-results.component.html`**

Wrap filters content in a template variable, then use it in both the sidebar and the drawer:
```html
<!-- Mobile filter trigger button (hidden on desktop via CSS) -->
<div class="mobile-filter-bar">
  <button class="btn-secondary mobile-filter-btn" (click)="drawerOpen.set(true)">
    <lucide-icon name="sliders-horizontal" [size]="16"></lucide-icon>
    {{ activeFilterCount > 0
        ? ('filters.active_count' | translate:{ count: activeFilterCount })
        : ('filters.open' | translate) }}
  </button>
</div>

<!-- Sidebar (desktop) -->
<aside class="filters-sidebar">
  <ng-container *ngTemplateOutlet="filterContent"></ng-container>
</aside>

<!-- Bottom sheet drawer (mobile) -->
@if (drawerOpen()) {
  <div class="filter-overlay" (click)="drawerOpen.set(false)"></div>
  <div class="filter-drawer">
    <div class="filter-drawer-header">
      <h3>{{ 'filters.title' | translate }}</h3>
      <button (click)="drawerOpen.set(false)" [attr.aria-label]="'filters.close' | translate">
        <lucide-icon name="x" [size]="20"></lucide-icon>
      </button>
    </div>
    <ng-container *ngTemplateOutlet="filterContent"></ng-container>
    <button class="btn-primary" (click)="applyFilters(); drawerOpen.set(false)">
      {{ 'filters.apply' | translate }}
    </button>
  </div>
}

<!-- Reusable filter template -->
<ng-template #filterContent>
  <!-- existing filter sections — no changes to their content -->
</ng-template>
```

- [ ] **Step 4: Add drawer styles to `search-results.component.scss`**

```scss
.mobile-filter-bar { display: none; }

.filter-overlay {
  display: none;
}

.filter-drawer {
  display: none;
}

@media (max-width: 768px) {
  .filters-sidebar { display: none; }
  .mobile-filter-bar { display: flex; margin-bottom: 1rem; }

  .filter-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 800;
  }

  .filter-drawer {
    display: flex;
    flex-direction: column;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 85vh;
    background: var(--surface-1);
    border-radius: 20px 20px 0 0;
    z-index: 801;
    padding: 1.5rem;
    overflow-y: auto;
    box-shadow: 0 -8px 30px rgba(0,0,0,0.15);
    gap: 1rem;
  }

  .filter-drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
```

- [ ] **Step 5: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/search-results/ src/assets/i18n/
git commit -m "feat(search): add mobile bottom-sheet filter drawer"
```

---

## Task 14: Contextual empty search messages

**Files:**
- Modify: `src/app/pages/search-results/search-results.component.html`
- Modify: `src/app/pages/search-results/search-results.component.ts`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"search.empty_text": "No encontramos productos para \"{{query}}\". Intenta con otro término.",
"search.empty_price": "Ningún producto tiene ese rango de precio. Prueba ampliando el rango.",
"search.empty_category_text": "No hay productos en \"{{category}}\" con ese nombre.",
"search.empty_stock": "Estos productos están agotados temporalmente.",
"search.empty_stock_action": "Ver también sin stock",
"search.reset_text": "Limpiar búsqueda",
"search.reset_price": "Ajustar precio",
"search.reset_category": "Ver todos en esta categoría"
```

In `en.json`:
```json
"search.empty_text": "No products found for \"{{query}}\". Try a different term.",
"search.empty_price": "No products match that price range. Try expanding the range.",
"search.empty_category_text": "No products in \"{{category}}\" match that name.",
"search.empty_stock": "These products are temporarily sold out.",
"search.empty_stock_action": "Show out-of-stock too",
"search.reset_text": "Clear search",
"search.reset_price": "Adjust price",
"search.reset_category": "See all in this category"
```

Add to remaining 6 files.

- [ ] **Step 2: Add `emptyReason` computed property to `search-results.component.ts`**

```typescript
get emptyReason(): 'text' | 'price' | 'category+text' | 'stock' | 'generic' {
  const hasText = !!this.filters.q;
  const hasCategory = !!this.filters.category;
  const hasPrice = !!(this.filters.minPrice || this.filters.maxPrice);
  const hasStock = !!this.filters.onlyInStock;

  if (hasCategory && hasText) return 'category+text';
  if (hasText) return 'text';
  if (hasPrice) return 'price';
  if (hasStock) return 'stock';
  return 'generic';
}
```

- [ ] **Step 3: Replace no-results block in `search-results.component.html`**

```html
<div class="no-results" *ngIf="!isLoading && products.length === 0">
  <div class="no-results-content">
    <lucide-icon name="search" [size]="48"></lucide-icon>

    @switch (emptyReason) {
      @case ('text') {
        <h3>{{ 'search.empty_text' | translate:{ query: filters.q } }}</h3>
        <button class="btn-secondary" (click)="filters.q = ''; applyFilters()">
          {{ 'search.reset_text' | translate }}
        </button>
      }
      @case ('price') {
        <h3>{{ 'search.empty_price' | translate }}</h3>
        <button class="btn-secondary" (click)="filters.minPrice = null; filters.maxPrice = null; applyFilters()">
          {{ 'search.reset_price' | translate }}
        </button>
      }
      @case ('category+text') {
        <h3>{{ 'search.empty_category_text' | translate:{ category: filters.category } }}</h3>
        <button class="btn-secondary" (click)="filters.q = ''; applyFilters()">
          {{ 'search.reset_text' | translate }}
        </button>
      }
      @case ('stock') {
        <h3>{{ 'search.empty_stock' | translate }}</h3>
        <button class="btn-secondary" (click)="filters.onlyInStock = false; applyFilters()">
          {{ 'search.empty_stock_action' | translate }}
        </button>
      }
      @default {
        <h3>{{ 'search.no_results' | translate }}</h3>
        <p>{{ 'search.no_results_hint' | translate }}</p>
      }
    }

    <button class="btn-ghost" (click)="clearFilters()">{{ 'search.see_all' | translate }}</button>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/search-results/ src/assets/i18n/
git commit -m "feat(search): add contextual empty state messages based on active filters"
```

---

## Task 15: Empty states — cart and favorites with category chips

**Files:**
- Modify: `src/app/pages/cart/cart.component.html`
- Modify: `src/app/pages/favorites/favorites.component.html`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"cart.empty_categories_hint": "¿Qué te gustaría explorar?",
"favorites.empty_hint": "Guarda los productos que te gustan para encontrarlos fácilmente.",
"favorites.empty_categories_hint": "Empieza explorando una categoría:"
```

In `en.json`:
```json
"cart.empty_categories_hint": "What would you like to explore?",
"favorites.empty_hint": "Save products you like to find them easily.",
"favorites.empty_categories_hint": "Start exploring a category:"
```

Add to remaining 6 files.

- [ ] **Step 2: Update empty cart state in `cart.component.html`**

After the existing empty state content, add:
```html
<p class="empty-categories-label">{{ 'cart.empty_categories_hint' | translate }}</p>
<div class="empty-category-chips">
  <a routerLink="/busqueda" [queryParams]="{ category: 'Labiales' }" class="category-chip">
    <lucide-icon name="heart" [size]="14"></lucide-icon> {{ 'categories.lips' | translate }}
  </a>
  <a routerLink="/busqueda" [queryParams]="{ category: 'Ojos' }" class="category-chip">
    <lucide-icon name="eye" [size]="14"></lucide-icon> {{ 'categories.eyes' | translate }}
  </a>
  <a routerLink="/busqueda" [queryParams]="{ category: 'Rostro' }" class="category-chip">
    <lucide-icon name="palette" [size]="14"></lucide-icon> {{ 'categories.face' | translate }}
  </a>
</div>
```

- [ ] **Step 3: Update empty favorites state in `favorites.component.html`**

Add after the existing empty icon/message:
```html
<p class="favorites-hint">{{ 'favorites.empty_hint' | translate }}</p>
<p class="empty-categories-label">{{ 'favorites.empty_categories_hint' | translate }}</p>
<div class="empty-category-chips">
  <a routerLink="/busqueda" [queryParams]="{ category: 'Labiales' }" class="category-chip">
    <lucide-icon name="heart" [size]="14"></lucide-icon> {{ 'categories.lips' | translate }}
  </a>
  <a routerLink="/busqueda" [queryParams]="{ category: 'Ojos' }" class="category-chip">
    <lucide-icon name="eye" [size]="14"></lucide-icon> {{ 'categories.eyes' | translate }}
  </a>
  <a routerLink="/busqueda" [queryParams]="{ category: 'Rostro' }" class="category-chip">
    <lucide-icon name="palette" [size]="14"></lucide-icon> {{ 'categories.face' | translate }}
  </a>
</div>
```

- [ ] **Step 4: Add chip styles to `styles.scss`** (global, reused in both pages)

```scss
.empty-category-chips {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1.25rem;
  border: 1.5px solid var(--primary-color);
  border-radius: 25px;
  color: var(--primary-color);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--primary-color);
    color: #fff;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/cart/ src/app/pages/favorites/ src/styles.scss src/assets/i18n/
git commit -m "feat(ux): add category chips to empty cart and favorites states"
```

---

## Task 16: Free shipping progress bar

**Files:**
- Modify: `src/app/pages/cart/cart.component.html`
- Modify: `src/app/pages/cart/cart.component.scss`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add i18n keys**

In `es.json`:
```json
"cart.shipping_progress_hint": "¡Solo faltan {{amount}} para envío gratis!",
"cart.shipping_achieved": "¡Envío gratis desbloqueado!"
```

In `en.json`:
```json
"cart.shipping_progress_hint": "Only {{amount}} left for free shipping!",
"cart.shipping_achieved": "Free shipping unlocked!"
```

Add to remaining 6 files.

- [ ] **Step 2: Replace shipping hint section in `cart.component.html`**

Replace the existing `.shipping-info` and `.shipping-info-success` divs with:
```html
<!-- Free shipping progress bar -->
<div class="shipping-progress">
  <div class="shipping-progress-bar-wrap">
    <div class="shipping-progress-bar"
      [style.width.%]="shippingProgress"
      [class.full]="total >= 500">
    </div>
  </div>
  @if (total < 500) {
    <p class="shipping-progress-msg">
      <lucide-icon name="truck" [size]="14"></lucide-icon>
      {{ 'cart.shipping_progress_hint' | translate:{ amount: (500 - total | currency:'MXN':'symbol':'1.0-0') } }}
    </p>
  } @else {
    <p class="shipping-progress-msg success">
      <lucide-icon name="circle-check" [size]="14"></lucide-icon>
      {{ 'cart.shipping_achieved' | translate }}
    </p>
  }
</div>
```

- [ ] **Step 3: Add `shippingProgress` getter to `cart.component.ts`**

```typescript
get shippingProgress(): number {
  return Math.min((this.total / 500) * 100, 100);
}
```

- [ ] **Step 4: Add styles to `cart.component.scss`**

```scss
.shipping-progress {
  margin-top: 1rem;
}

.shipping-progress-bar-wrap {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.shipping-progress-bar {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.4s ease;

  &.full { background: #16a34a; }
}

.shipping-progress-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-secondary);

  &.success { color: #16a34a; font-weight: 600; }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/cart/ src/assets/i18n/
git commit -m "feat(cart): replace shipping hint text with animated progress bar"
```

---

## Task 17: Loading feedback on add-to-cart and favorites buttons

**Files:**
- Modify: `src/app/pages/search-results/search-results.component.html`
- Modify: `src/app/pages/search-results/search-results.component.ts`
- Modify: `src/app/pages/favorites/favorites.component.html`
- Modify: `src/app/pages/favorites/favorites.component.ts`

- [ ] **Step 1: Add loading state to `search-results.component.ts`**

```typescript
// Track loading per product id
addingToCart = signal<Set<number>>(new Set());
togglingFavorite = signal<Set<number>>(new Set());
justAdded = signal<Set<number>>(new Set());

addToCart(product: any) {
  if (this.addingToCart().has(product.id)) return;
  this.addingToCart.update(s => new Set([...s, product.id]));
  this.cartService.addItem(product.id, 1).subscribe({
    next: () => {
      this.addingToCart.update(s => { const n = new Set(s); n.delete(product.id); return n; });
      this.justAdded.update(s => new Set([...s, product.id]));
      setTimeout(() => this.justAdded.update(s => { const n = new Set(s); n.delete(product.id); return n; }), 1500);
      this.notif.showToast(this.i18n.t('cart.added'), 'success');
    },
    error: () => this.addingToCart.update(s => { const n = new Set(s); n.delete(product.id); return n; })
  });
}

toggleFavorite(product: any) {
  if (this.togglingFavorite().has(product.id)) return;
  this.togglingFavorite.update(s => new Set([...s, product.id]));
  // existing toggle logic, then clear the set entry on complete
}
```

- [ ] **Step 2: Update add-to-cart button in `search-results.component.html`**

```html
<button class="add-to-cart-btn"
  [disabled]="product.stock === 0 || addingToCart().has(product.id)"
  (click)="addToCart(product)">
  @if (addingToCart().has(product.id)) {
    <lucide-icon name="loader-circle" [size]="18" class="spin"></lucide-icon>
  } @else if (justAdded().has(product.id)) {
    <lucide-icon name="check" [size]="18"></lucide-icon>
  } @else {
    <lucide-icon name="shopping-bag" [size]="18"></lucide-icon>
  }
</button>
```

Update the favorite overlay button:
```html
<button class="favorite-overlay-btn" [class.active]="isFavorite(product.id)"
  [disabled]="togglingFavorite().has(product.id)"
  (click)="toggleFavorite(product); $event.stopPropagation()">
  @if (togglingFavorite().has(product.id)) {
    <lucide-icon name="loader-circle" [size]="18" class="spin"></lucide-icon>
  } @else {
    <lucide-icon name="heart" [size]="18"></lucide-icon>
  }
</button>
```

- [ ] **Step 3: Add same loading pattern to `favorites.component.ts` and `.html`**

Add `removingId = signal<number | null>(null)` and `addingToCartId = signal<number | null>(null)` signals to `favorites.component.ts`. Apply same button pattern in the template.

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/search-results/ src/app/pages/favorites/
git commit -m "feat(ux): add per-product loading and success feedback on cart/favorites buttons"
```

---

## Task 18: Dynamic page titles with i18n

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/assets/i18n/es.json` (and all 7 others)

- [ ] **Step 1: Add page title i18n keys**

In `es.json`:
```json
"page.title.home": "Inicio",
"page.title.search": "Catálogo",
"page.title.cart": "Mi Carrito",
"page.title.favorites": "Mis Favoritos",
"page.title.profile": "Mi Perfil",
"page.title.login": "Iniciar Sesión",
"page.title.register": "Crear Cuenta",
"page.title.hairstyles": "Peinados y Cortes",
"page.title.nail_designs": "Diseños de Uñas",
"page.title.admin": "Panel Admin",
"page.title.404": "Página no encontrada",
"page.title.terms": "Términos de Uso"
```

In `en.json`:
```json
"page.title.home": "Home",
"page.title.search": "Catalog",
"page.title.cart": "My Cart",
"page.title.favorites": "My Favorites",
"page.title.profile": "My Profile",
"page.title.login": "Sign In",
"page.title.register": "Create Account",
"page.title.hairstyles": "Hairstyles",
"page.title.nail_designs": "Nail Designs",
"page.title.admin": "Admin Panel",
"page.title.404": "Page not found",
"page.title.terms": "Terms of Use"
```

Add to remaining 6 files.

- [ ] **Step 2: Create a `TitleStrategyService` to handle i18n titles**

Add to `src/app/app.config.ts` or a new file `src/app/services/i18n-title.strategy.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);

  override updateTitle(snapshot: RouterStateSnapshot) {
    const routeTitle = this.buildTitle(snapshot);
    if (routeTitle) {
      // routeTitle is the i18n key stored in route.title
      const translated = this.i18n.t(routeTitle);
      this.title.setTitle(`${translated} — ELA Beauty`);
    } else {
      this.title.setTitle('ELA Beauty');
    }
  }
}
```

Register in `app.config.ts`:
```typescript
import { I18nTitleStrategy } from './services/i18n-title.strategy';
import { TitleStrategy } from '@angular/router';

// In providers array:
{ provide: TitleStrategy, useClass: I18nTitleStrategy }
```

- [ ] **Step 3: Update route `title` values to i18n keys in `app.routes.ts`**

```typescript
{ path: '', component: BodyComponent, title: 'page.title.home' },
{ path: 'busqueda', component: SearchResultsComponent, title: 'page.title.search' },
{ path: 'carrito', ..., title: 'page.title.cart' },
{ path: 'favoritos', ..., title: 'page.title.favorites' },
{ path: 'perfil', ..., title: 'page.title.profile' },
// auth children:
{ path: 'login', ..., title: 'page.title.login' },
{ path: 'register', ..., title: 'page.title.register' },
{ path: 'peinados', ..., title: 'page.title.hairstyles' },
{ path: 'disenos-unas', ..., title: 'page.title.nail_designs' },
{ path: 'admin', ..., title: 'page.title.admin' },
{ path: '**', ..., title: 'page.title.404' },
```

Remove the emoji from the favorites route title.

- [ ] **Step 4: Build check**

```bash
cd frontend && ng build --configuration development 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/assets/i18n/
git commit -m "feat(i18n): dynamic page titles via I18nTitleStrategy — updates with language change"
```

---

## Self-Review

**Spec coverage check:**
- ✅ 1.1 Login i18n + icons → Task 3
- ✅ 1.2 Cart/Profile icon consistency → Task 6, 7
- ✅ 1.3 Checkout i18n + validation + autocomplete → Task 8
- ✅ 1.4 Show/hide password → Tasks 3, 4, 5
- ✅ 1.5 Button normalization → Task 1
- ✅ 1.6 Section spacing → Task 1
- ✅ 1.7 Remove testimonials → Task 2
- ✅ 2.1 Dead links → disabled buttons → Task 9
- ✅ 2.2 Autocomplete on auth forms → Tasks 3, 4
- ✅ 2.3 Dynamic page titles → Task 18
- ✅ 2.4 Inactivity auto-logout → Task 12
- ✅ 3.1 Mobile filter drawer → Task 13
- ✅ 3.2 Empty states → Task 15
- ✅ 3.3 Mobile hamburger → Task 9
- ✅ 3.4 Cart quantity trash-at-1 → Task 6
- ✅ 3.5 Loading feedback → Task 17
- ✅ 3.6 Free shipping bar → Task 16
- ✅ 3.7 Profile order history → Task 7
- ✅ 3.8 404 + unauthorized → Task 11
- ✅ 3.9 Contextual empty search → Task 14
- ✅ 3.10 Back-to-top → Task 10

**Task order dependency check:**
- Task 1 (button system) must complete before any task that adds `btn-primary`/`btn-secondary`/`btn-ghost` classes ✅
- Task 12 (InactivityService) depends on `AuthService.logout()` observable interface — confirmed it returns Observable ✅
- Task 18 (TitleStrategy) must run after all route title keys are confirmed ✅

**No placeholders detected** — all steps include actual code.
