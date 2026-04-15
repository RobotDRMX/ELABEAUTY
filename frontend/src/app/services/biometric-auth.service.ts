import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as faceapi from 'face-api.js';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BiometricAuthService {
  private readonly API = environment.apiBaseUrl + '/auth';
  private readonly MODELS_URL = 'assets/models';

  readonly webAuthnSupported = signal(browserSupportsWebAuthn());
  readonly modelsLoaded      = signal(false);
  readonly cameraActive      = signal(false);

  private videoEl: HTMLVideoElement | null = null;
  private stream:  MediaStream | null      = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ── WebAuthn ─────────────────────────────────────────────────────────────

  async registerPasskey(): Promise<void> {
    const options = await firstValueFrom(
      this.http.get<any>(`${this.API}/webauthn/register/options`, { withCredentials: true }),
    );
    const registrationResponse = await startRegistration({ optionsJSON: options });
    await firstValueFrom(
      this.http.post(
        `${this.API}/webauthn/register/verify`,
        { registrationResponse },
        { withCredentials: true },
      ),
    );
  }

  // email is optional: if omitted, browser shows a passkey picker (discoverable credentials).
  async loginWithPasskey(email?: string): Promise<any> {
    const body = email ? { email } : {};
    const result = await firstValueFrom(
      this.http.post<{ options: any; userId?: number }>(
        `${this.API}/webauthn/login/options`,
        body,
      ),
    );
    const authenticationResponse = await startAuthentication({ optionsJSON: result.options });
    const loginResult = await firstValueFrom(
      this.http.post<{ user: any; access_token: string }>(
        `${this.API}/webauthn/login/verify`,
        { email, userId: result.userId, authenticationResponse },
        { withCredentials: true },
      ),
    );
    this.authService.setAccessToken(loginResult.access_token);
    return loginResult;
  }

  // ── face-api.js ──────────────────────────────────────────────────────────

  async loadModels(): Promise<void> {
    if (this.modelsLoaded()) return;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(this.MODELS_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(this.MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS_URL),
    ]);
    this.modelsLoaded.set(true);
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.videoEl = videoElement;
    this.stream  = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 240 },
    });
    videoElement.srcObject = this.stream;
    // autoplay + muted + playsinline attributes handle playback automatically.
    // Calling play() explicitly can cause AbortError when Angular re-renders mid-cycle.
    await new Promise<void>(resolve => {
      videoElement.onloadedmetadata = () => resolve();
      // Fallback in case the event already fired
      setTimeout(resolve, 500);
    });
    this.cameraActive.set(true);
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.videoEl) this.videoEl.srcObject = null;
    this.cameraActive.set(false);
  }

  async captureDescriptor(): Promise<number[] | null> {
    // Verificar prerequisitos antes de intentar la detección
    if (!this.modelsLoaded()) {
      throw new Error('Los modelos de reconocimiento facial aún no se han cargado. Espera un momento e inténtalo de nuevo.');
    }
    if (!this.videoEl) {
      throw new Error('El elemento de vídeo no está disponible. Activa la cámara primero.');
    }
    if (!this.cameraActive()) {
      throw new Error('La cámara no está activa. Actívala e inténtalo de nuevo.');
    }
    // readyState >= 2 = HAVE_CURRENT_DATA: el vídeo tiene suficientes datos para detectar
    if (this.videoEl.readyState < 2) {
      throw new Error('La cámara todavía no está lista. Espera un segundo e inténtalo de nuevo.');
    }

    const detection = await faceapi
      .detectSingleFace(this.videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    return detection ? Array.from(detection.descriptor) : null;
  }

  async saveMyFaceDescriptor(): Promise<void> {
    // captureDescriptor() ya lanza errores descriptivos si la cámara o los modelos no están listos
    const descriptor = await this.captureDescriptor();
    if (!descriptor) {
      throw new Error('No se detectó ningún rostro. Colócate frente a la cámara, mejora la iluminación e inténtalo de nuevo.');
    }
    if (descriptor.length !== 128) {
      throw new Error('Descriptor facial inválido (se esperaban 128 valores). Recarga la página e inténtalo de nuevo.');
    }
    await firstValueFrom(
      this.http.post(`${this.API}/face/save`, { descriptor }, { withCredentials: true }),
    );
  }

  // Face-only login: requires email to narrow search to single user.
  async loginWithFaceOnly(email: string): Promise<any> {
    const faceDescriptor = await this.captureDescriptor();
    if (!faceDescriptor) {
      throw new Error('No se detectó tu rostro. Colócate frente a la cámara, mejora la iluminación e inténtalo de nuevo.');
    }
    const result = await firstValueFrom(
      this.http.post<{ user: any; access_token: string }>(
        `${this.API}/login/face-only`,
        { email, faceDescriptor },
        { withCredentials: true },
      ),
    );
    this.authService.setAccessToken(result.access_token);
    return result;
  }

  // Face second-factor: sends email + password + face descriptor together.
  async loginWithFace(email: string, password: string): Promise<any> {
    const faceDescriptor = await this.captureDescriptor();
    if (!faceDescriptor) {
      throw new Error('No se detectó tu rostro. Usa email/contraseña o mejora la iluminación.');
    }
    const result = await firstValueFrom(
      this.http.post<{ user: any; access_token: string }>(
        `${this.API}/login/face`,
        { email, password, faceDescriptor, recaptchaToken: 'face-auth' },
        { withCredentials: true },
      ),
    );
    this.authService.setAccessToken(result.access_token);
    return result;
  }
}
