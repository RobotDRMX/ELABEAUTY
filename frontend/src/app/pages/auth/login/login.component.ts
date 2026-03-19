import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BiometricAuthService } from '../../../services/biometric-auth.service';

// Global object injected by Google reCAPTCHA v3 script
declare const grecaptcha: {
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_SITE_KEY';

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

  // ── Standard login ────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error   = '';

    let recaptchaToken: string;
    try {
      recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
    } catch {
      this.error   = 'Error al verificar seguridad. Recarga la página e inténtalo de nuevo.';
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

  // ── Face (second factor) ─────────────────────────────────────────────────
  async activateFaceLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error = 'Completa email y contraseña primero (son necesarios junto al reconocimiento facial)';
      return;
    }
    this.biometricMode = 'face';
    this.error         = '';
    await this.biometric.loadModels();
    // Wait for Angular to render the <video> element
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
      // Automatic fallback: if face not detected → try standard login
      if (e.message?.includes('No se detectó')) {
        this.biometric.stopCamera();
        this.biometricMode = 'none';
        this.error = 'No se detectó tu rostro. Ingresando con contraseña...';
        this.authService.login(this.loginForm.value).subscribe({
          next: (r: any) => this.redirect(r),
          error: (err: any) => { this.error = err.error?.message || 'Error al iniciar sesión'; this.loading = false; },
        });
      } else {
        this.error   = e.error?.message || e.message || 'Reconocimiento fallido';
        this.loading = false;
      }
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
