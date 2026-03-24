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
