import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en .env');
    }

    this.client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    });
  }

  /**
   * Crea un shadow-user en Supabase Auth y dispara el correo de confirmación.
   * Usa auth.signUp (no admin.createUser) porque signUp envía el email automáticamente.
   * La contraseña es un UUID aleatorio — nunca se usa para login en nuestro sistema.
   */
  async createAuthUser(email: string): Promise<void> {
    const { error } = await this.client.auth.signUp({
      email,
      password: randomUUID(),
    });

    // Si el usuario ya existe en Supabase (reintento tras fallo), lo ignoramos
    if (error && !error.message.toLowerCase().includes('already registered')) {
      throw new Error(`Supabase signUp failed: ${error.message}`);
    }
  }

  /**
   * Envía el correo de recuperación de contraseña.
   * Usa el template "Reset Password" configurado en el dashboard de Supabase.
   */
  async sendPasswordRecovery(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(`Supabase resetPassword failed: ${error.message}`);
    }
  }

  /**
   * Valida un token OTP recibido del link de correo y retorna el email del usuario.
   *
   * IMPORTANTE — tipos correctos para flujos token_hash:
   *   type: 'email'    → confirmación de cuenta (link de registro)
   *   type: 'recovery' → recuperación de contraseña (link de reset)
   *
   * El valor 'signup' solo aplica para OTPs de 6 dígitos (magic link), no para token_hash.
   */
  async verifyOtp(token_hash: string, type: 'email' | 'recovery'): Promise<string> {
    const { data, error } = await this.client.auth.verifyOtp({ token_hash, type });

    if (error || !data.user?.email) {
      throw new Error('Token inválido o expirado');
    }

    return data.user.email;
  }

  /**
   * Reenvía el correo de confirmación para un email ya registrado en Supabase.
   */
  async resendConfirmation(email: string): Promise<void> {
    const { error } = await this.client.auth.resend({
      type:  'signup',
      email,
    });
    if (error) {
      throw new Error(`Supabase resend failed: ${error.message}`);
    }
  }
}
