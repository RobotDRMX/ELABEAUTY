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
