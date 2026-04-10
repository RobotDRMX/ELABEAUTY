import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder,
  FormGroup, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

declare const grecaptcha: {
  execute(siteKey: string, options: { action: string }): Promise<string>;
  ready(cb: () => void): void;
};

const RECAPTCHA_SITE_KEY = environment.recaptchaSiteKey;

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm  = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    error: string = '';
    loading: boolean = false;
    successMsg: string = '';
    showPassword = signal(false);
    showConfirm = signal(false);

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

    constructor(
        private fb: FormBuilder,
        private authService: AuthService
    ) {
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
    }

    ngOnInit(): void {
        try {
            grecaptcha.ready(() => {
                grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'register_page_view' }).catch(() => {});
            });
        } catch {
            // Script still loading — will execute on submit
        }
    }

    async onSubmit(): Promise<void> {
        if (this.registerForm.invalid) return;

        this.loading = true;
        this.error = '';

        let recaptchaToken: string;
        try {
            recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'register' });
        } catch {
            this        .error   = 'Error al verificar seguridad. Recarga la página e inténtalo de nuevo.';
            this.loading = false;
            return;
        }

        const { confirmPassword: _, ...formData } = this.registerForm.value;
        this.authService.register({ ...formData, recaptchaToken })
            .subscribe({
                next: () => {
                    this.successMsg = 'Registro exitoso. Revisa tu correo y confirma tu cuenta para poder iniciar sesión.';
                    this.loading = false;
                },
                error: (err: any) => {
                    this.error = err.error?.message || 'Error al registrarse';
                    this.loading = false;
                }
            });
    }
}
