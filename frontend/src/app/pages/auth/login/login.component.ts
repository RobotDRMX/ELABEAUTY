import { Component, ChangeDetectorRef, ElementRef, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { BiometricAuthService } from '../../../services/biometric-auth.service';
import { environment } from '../../../../environments/environment';

declare const grecaptcha: {
  execute(siteKey: string, options: { action: string }): Promise<string>;
  ready(cb: () => void): void;
};

const RECAPTCHA_SITE_KEY = environment.recaptchaSiteKey;

type BiometricMode = 'none' | 'face';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('videoRef') videoRef?: ElementRef<HTMLVideoElement>;

  loginForm: FormGroup;
  error        = '';
  loading      = false;
  biometricMode: BiometricMode = 'none';
  countdown    = 0; // seconds remaining before next attempt is allowed
  showPassword = signal(false);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb:          FormBuilder,
    private authService: AuthService,
    public  biometric:   BiometricAuthService,
    private router:      Router,
    private cdr:         ChangeDetectorRef,
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    try {
      grecaptcha.ready(() => {
        grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'auth_page_view' }).catch(() => {});
      });
    } catch {
      // script still loading — will execute on submit
    }
  }

  ngOnDestroy(): void {
    this.biometric.stopCamera();
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  get isBlocked(): boolean {
    return this.countdown > 0;
  }

  // ── Standard login ────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.isBlocked) return;
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
        this.handleError(e);
        this.loading = false;
      },
    });
  }

  // ── Passkey ───────────────────────────────────────────────────────────────
  async loginPasskey(): Promise<void> {
    if (this.isBlocked) return;
    this.loading = true;
    this.error   = '';
    const email = this.loginForm.get('email')?.value as string | undefined;
    try {
      const r = await this.biometric.loginWithPasskey(email || undefined);
      this.redirect(r);
    } catch (e: any) {
      this.handleError(e);
      this.loading = false;
    }
  }

  // ── Face-only login ───────────────────────────────────────────────────────
  async activateFaceLogin(): Promise<void> {
    if (this.isBlocked) return;
    this.biometricMode = 'face';
    this.error         = '';

    try {
      await this.biometric.loadModels();
      this.cdr.detectChanges();
      await new Promise(resolve => requestAnimationFrame(resolve));

      if (!this.videoRef?.nativeElement) throw new Error('No se pudo inicializar el video');
      await this.biometric.startCamera(this.videoRef.nativeElement);
    } catch (e: any) {
      this.biometricMode = 'none';
      this.cdr.detectChanges();
      this.error = e.message || 'No se pudo acceder a la cámara';
    }
  }

  async loginWithFace(): Promise<void> {
    if (this.isBlocked) return;

    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.error = 'Ingresa tu correo electrónico antes de verificar tu rostro.';
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

  cancelFace(): void {
    this.biometricMode = 'none';
    this.biometric.stopCamera();
    this.error = '';
  }

  // ── Error handling ────────────────────────────────────────────────────────
  private handleError(e: any): void {
    // Rate limit (429) — start countdown
    if (e?.status === 429) {
      const retryAfter = parseInt(e.headers?.get('Retry-After') ?? '60', 10);
      this.startCountdown(isNaN(retryAfter) ? 60 : retryAfter);
      this.error = `Demasiados intentos fallidos. Podrás intentarlo de nuevo en breve.`;
      return;
    }

    // JSON parse failure — server returned non-JSON (HTML error page, cold-start splash, etc.)
    if (e?.error instanceof SyntaxError || e?.name === 'SyntaxError') {
      this.error = 'El servidor no está disponible. Espera unos segundos e inténtalo de nuevo.';
      return;
    }

    // WebAuthn / browser errors (these have e.name set by the browser, not HTTP status)
    const name = e?.name ?? '';

    if (name === 'NotAllowedError' || name === 'SecurityError') {
      this.error = 'Se agotó el tiempo o cancelaste la operación. Pulsa el botón de nuevo cuando estés listo.';
      return;
    }

    if (name === 'AbortError') {
      this.error = 'La operación fue cancelada. Puedes intentarlo de nuevo.';
      return;
    }

    // For HttpErrorResponse, e.message is the HTTP framework string ("Http failure response for ...").
    // The actual server error message lives in e.error.message (parsed JSON body).
    const serverMsg = (typeof e?.error === 'object' && e.error !== null)
      ? String(e.error?.message ?? '')
      : '';
    const message = (serverMsg || e?.message || '').toLowerCase();

    if (message.includes('no passkey') || message.includes('no credentials') || message.includes('sin passkey') || message.includes('no tiene passkey')) {
      this.error = 'No tienes un Passkey registrado. Inicia sesión con tu contraseña y regístralo desde tu perfil.';
      return;
    }

    if (message.includes('rostro no reconocido') || message.includes('no se detectó') || message.includes('no se reconocio')) {
      this.error = 'No se reconoció tu rostro. Asegúrate de tener buena iluminación y mira de frente a la cámara.';
      return;
    }

    if (message.includes('descriptor facial') || message.includes('corrupto') || message.includes('cifrado')) {
      this.error = 'Error en el descriptor facial. Por favor registra tu rostro de nuevo desde tu perfil.';
      return;
    }

    if (message.includes('timed out') || message.includes('not allowed')) {
      this.error = 'Se agotó el tiempo de la operación. Inténtalo de nuevo.';
      return;
    }

    // Server waking up or unreachable
    if (e?.status === 0 || e?.status === 502 || e?.status === 503 || typeof e?.error === 'string') {
      this.error = 'El servidor está iniciando, espera unos segundos e inténtalo de nuevo.';
      return;
    }

    // Generic fallback — prefer server message over the HTTP framework message
    this.error = serverMsg || e?.message || 'Algo salió mal. Inténtalo de nuevo.';
  }

  private startCountdown(seconds: number): void {
    this.countdown = seconds;
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.error = '';
        clearInterval(this.countdownInterval!);
        this.countdownInterval = null;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private redirect(r: any): void {
    if (r?.user?.role === 'admin') this.router.navigate(['/admin']);
    else this.router.navigate(['/']);
  }
}
