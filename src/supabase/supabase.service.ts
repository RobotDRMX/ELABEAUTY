import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  /**
   * Client con service_role key — operaciones admin que NO necesitan enviar email
   * (verifyOtp). NO usar para signUp: el service_role auto-confirma usuarios y omite el email.
   */
  private readonly adminClient: SupabaseClient;

  /**
   * Client con anon key — operaciones de auth que SÍ disparan correos
   * (signUp, resetPasswordForEmail, resend). Requiere SUPABASE_ANON_KEY en .env.
   */
  private readonly anonClient: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url        = config.get<string>('SUPABASE_URL');
    const serviceKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey    = config.get<string>('SUPABASE_ANON_KEY');

    if (!url || !serviceKey) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en .env');
    }
    if (!anonKey) {
      throw new Error(
        'SUPABASE_ANON_KEY debe estar definido en .env.\n' +
        'Encuéntralo en: Supabase Dashboard → Settings → API → Project API keys → "anon / public".\n' +
        'Es necesario para que signUp y resetPasswordForEmail disparen los correos correctamente.',
      );
    }

    const clientOptions = {
      auth: { autoRefreshToken: false, persistSession: false },
    };

    this.adminClient = createClient(url, serviceKey, clientOptions);
    this.anonClient  = createClient(url, anonKey,    clientOptions);
  }

  /**
   * Crea un shadow-user en Supabase Auth y dispara el correo de confirmación.
   *
   * IMPORTANTE: usa anonClient (no adminClient) porque el service_role auto-confirma
   * usuarios en signUp, omitiendo el envío del correo de confirmación.
   */
  async createAuthUser(email: string): Promise<void> {
    const { data, error } = await this.anonClient.auth.signUp({
      email,
      password: randomUUID(),
    });

    this.logger.debug(
      `[signUp] email=${email} | userId=${data?.user?.id ?? 'null'} | ` +
      `confirmado=${data?.user?.email_confirmed_at ? 'sí' : 'no'} | ` +
      `error=${error?.message ?? 'ninguno'}`,
    );

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        // Usuario ya existe en Supabase — reintento tras fallo previo, ignorar
        this.logger.warn(`[signUp] usuario ${email} ya existía en Supabase. Se ignora.`);
        return;
      }
      this.logger.error(`[signUp] falló para ${email}: ${error.message}`, error);
      throw new Error(`Supabase signUp failed: ${error.message}`);
    }
  }

  /**
   * Envía el correo de recuperación de contraseña con redirectTo hacia el frontend.
   *
   * IMPORTANTE: usa anonClient para que el template "Reset Password" del dashboard
   * de Supabase se aplique correctamente y el correo sea enviado.
   * FRONTEND_URL debe estar en .env (e.g. https://ela-beauty.vercel.app).
   */
  async sendPasswordRecovery(email: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const redirectTo  = `${frontendUrl}/auth/nueva-contrasena`;

    const { error } = await this.anonClient.auth.resetPasswordForEmail(email, { redirectTo });

    this.logger.debug(
      `[resetPassword] email=${email} | redirectTo=${redirectTo} | error=${error?.message ?? 'ninguno'}`,
    );

    if (error) {
      this.logger.error(`[resetPassword] falló para ${email}: ${error.message}`, error);
      throw new Error(`Supabase resetPassword failed: ${error.message}`);
    }
  }

  /**
   * Valida un token OTP recibido del link de correo y retorna el email del usuario.
   *
   * Tipos correctos para flujos token_hash:
   *   type: 'email'    → confirmación de cuenta (link de registro)
   *   type: 'recovery' → recuperación de contraseña (link de reset)
   */
  async verifyOtp(token_hash: string, type: 'email' | 'recovery'): Promise<string> {
    const { data, error } = await this.adminClient.auth.verifyOtp({ token_hash, type });

    if (error || !data.user?.email) {
      this.logger.warn(
        `[verifyOtp] type=${type} | error=${error?.message ?? 'sin email en respuesta'}`,
      );
      throw new Error('Token inválido o expirado');
    }

    return data.user.email;
  }

  /**
   * Reenvía el correo de confirmación para un email ya registrado en Supabase.
   * Usa anonClient para que el email sea realmente enviado.
   */
  async resendConfirmation(email: string): Promise<void> {
    const { error } = await this.anonClient.auth.resend({ type: 'signup', email });

    this.logger.debug(`[resend] email=${email} | error=${error?.message ?? 'ninguno'}`);

    if (error) {
      this.logger.error(`[resend] falló para ${email}: ${error.message}`, error);
      throw new Error(`Supabase resend failed: ${error.message}`);
    }
  }
}
