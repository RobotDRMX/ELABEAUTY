import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BiometricAuthService } from '../../services/biometric-auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
    profileForm: FormGroup;
    loading: boolean = false;
    success: string = '';
    error: string = '';

    @ViewChild('enrollVideo') enrollVideoRef?: ElementRef<HTMLVideoElement>;
    enrollMode: 'none' | 'face' = 'none';
    enrollMsg    = '';
    enrollLoading = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        public biometric: BiometricAuthService,
    ) {
        this.profileForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        });
    }

    ngOnInit() {
        this.loadProfile();
    }

    ngOnDestroy(): void {
        this.biometric.stopCamera();
    }

    loadProfile() {
        this.loading = true;
        this.authService.getProfile().subscribe({
            next: (user) => {
                this.profileForm.patchValue(user);
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Error al cargar perfil';
                this.loading = false;
            }
        });
    }

    onSubmit() {
        if (this.profileForm.invalid) return;

        this.loading = true;
        this.success = '';
        this.error = '';

        this.authService.updateProfile(this.profileForm.getRawValue()).subscribe({
            next: (res) => {
                this.success = 'Perfil actualizado correctamente';
                localStorage.setItem('user', JSON.stringify(res));
                this.authService.currentUser.set(res);
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Error al actualizar perfil';
                this.loading = false;
            }
        });
    }

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
}
