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
