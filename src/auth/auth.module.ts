import {
  Module,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { WebAuthnService } from './webauthn.service';
import { FaceService } from './face.service';
import { WebAuthnChallenge } from './entities/webauthn-challenge.entity';
import { SupabaseService } from '../supabase/supabase.service';
import {
  RegisterDto, LoginDto, UpdateRoleDto,
  WebAuthnVerifyRegistrationDto, WebAuthnVerifyAuthDto,
  FaceDescriptorDto, FaceLoginDto, FaceOnlyLoginDto,
  VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto,
} from './dto/auth.dto';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

// --- ESTRATEGIA JWT (lee token de cookie HttpOnly) ---
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET no está definido en las variables de entorno. El servidor no puede iniciar.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Prefer Authorization: Bearer header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Fallback to cookie (for backwards compat)
        (request: Request) => {
          return (request?.cookies as Record<string, string>)?.['access_token'] ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}

// --- GUARD JWT ---
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// --- SERVICIO DE AUTENTICACIÓN ---
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly supabase: SupabaseService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // 1. Validar reCAPTCHA
    if (registerDto.recaptchaToken) {
      await this.verifyRecaptcha(registerDto.recaptchaToken);
    }

    // 2. Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      // Usuario existe pero nunca confirmó su correo → reenviar verificación
      if (!existingUser.isEmailVerified) {
        try {
          await this.supabase.resendConfirmation(existingUser.email);
        } catch {
          // Ignorar error de Supabase — respuesta genérica al usuario
        }
        return { message: 'Ya existe un registro pendiente de verificación. Te hemos reenviado el correo de confirmación.' };
      }
      throw new BadRequestException('El correo ya está registrado');
    }

    // 3. Crear usuario en MySQL (inactivo, sin verificar)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const { recaptchaToken: _, ...userData } = registerDto;
    const newUser = this.userRepository.create({
      ...userData,
      password:        hashedPassword,
      isActive:        false,
      isEmailVerified: false,
    });
    const savedUser = await this.userRepository.save(newUser);

    // 4. Crear shadow-user en Supabase y disparar email de confirmación
    //    Si Supabase falla, eliminar el usuario de MySQL para evitar huérfanos
    try {
      await this.supabase.createAuthUser(registerDto.email);
    } catch (err) {
      await this.userRepository.delete(savedUser.id);
      throw new BadRequestException('No se pudo enviar el correo de confirmación. Inténtalo de nuevo.');
    }

    return { message: 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.' };
  }

  async verifyEmail(token_hash: string): Promise<{ message: string }> {
    let email: string;
    try {
      email = await this.supabase.verifyOtp(token_hash, 'email');
    } catch {
      throw new BadRequestException('El enlace de confirmación es inválido o ya expiró.');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }
    if (user.isEmailVerified) {
      return { message: 'Tu correo ya estaba confirmado. Puedes iniciar sesión.' };
    }

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      isActive:        true,
    });

    return { message: 'Correo confirmado correctamente. Ya puedes iniciar sesión.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    const genericMessage = { message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.' };

    if (!user || user.isEmailVerified) {
      return genericMessage;
    }

    try {
      await this.supabase.resendConfirmation(email);
    } catch (err) {
      console.error('[Auth] resendVerification Supabase error:', err);
    }

    return genericMessage;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    const genericMessage = { message: 'Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.' };

    if (!user || !user.isEmailVerified || !user.isActive) {
      return genericMessage;
    }

    try {
      await this.supabase.sendPasswordRecovery(email);
    } catch (err) {
      console.error('[Auth] forgotPassword Supabase error:', err);
    }

    return genericMessage;
  }

  async resetPassword(token_hash: string, newPassword: string): Promise<{ message: string }> {
    let email: string;
    try {
      email = await this.supabase.verifyOtp(token_hash, 'recovery');
    } catch {
      throw new BadRequestException('El enlace de recuperación es inválido o ya expiró.');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.userRepository.update(user.id, { password: hashedPassword });

    return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }

  async login(
    loginDto: LoginDto,
    ip: string,
  ): Promise<{
    user: Omit<User, 'password'>;
    access_token: string;
    refresh_token: string;
  }> {
    await this.verifyRecaptcha(loginDto.recaptchaToken);

    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      console.warn(`[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`);
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ${minutesLeft} minutos.`
      );
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`);
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        console.warn(`[Auth] Cuenta bloqueada — email: ${loginDto.email} — intentos: ${attempts}`);
      }
      await this.userRepository.update(user.id, updateData);
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Debes confirmar tu correo antes de iniciar sesion. Revisa tu bandeja de entrada.'
      );
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userRepository.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    }

    const { password, ...userResult } = user;
    const tokens = await this.issueTokenPair(userResult as Omit<User, 'password'>);
    return { user: userResult as Omit<User, 'password'>, ...tokens };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const secret = this.configService.get<string>('JWT_SECRET')!;
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Verify the refresh token matches what we stored
    const incomingHash = this.hashToken(refreshToken);
    if (user.refreshTokenHash !== incomingHash) {
      // Possible token theft — invalidate all sessions
      await this.userRepository.update(user.id, { refreshTokenHash: null });
      console.warn(`[Auth] Posible robo de refresh token — userId: ${user.id}`);
      throw new UnauthorizedException('Sesion invalida. Inicia sesion de nuevo.');
    }

    // Rotate: issue new pair and invalidate old
    const { password, ...userResult } = user;
    return this.issueTokenPair(userResult as Omit<User, 'password'>);
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateData: any) {
    // No permitir actualizar password ni role por este endpoint
    const { password: _p, role: _r, ...safeData } = updateData;
    await this.userRepository.update(id, safeData);
    return this.findOne(id);
  }

  async updateRole(id: number, role: string) {
    if (!['user', 'admin'].includes(role)) {
      throw new BadRequestException(
        'Rol inválido. Valores permitidos: user, admin',
      );
    }
    await this.userRepository.update(id, { role });
    return this.findOne(id);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueTokenPair(user: Omit<User, 'password'>): Promise<{ access_token: string; refresh_token: string }> {
    const secret = this.configService.get<string>('JWT_SECRET')!;
    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload, { secret, expiresIn: '15m' });
    const refresh_token = this.jwtService.sign({ sub: user.id }, { secret, expiresIn: '7d' });

    await this.userRepository.update(user.id, {
      refreshTokenHash: this.hashToken(refresh_token),
    });

    return { access_token, refresh_token };
  }

  async verifyRecaptcha(token: string): Promise<void> {
    const secret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    // Skip in dev, skip for biometric logins (they have their own second factor)
    if (!secret || secret === 'YOUR_RECAPTCHA_SECRET_KEY' || token === 'face-auth') {
      return;
    }

    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams({ secret, response: token });

    const { data } = await firstValueFrom(
      this.httpService.post<{ success: boolean; score: number; action: string; 'error-codes'?: string[] }>(
        `${url}?${params.toString()}`,
      ),
    );

    // Log for monitoring — non-blocking: don't reject users if reCAPTCHA fails
    // (Firefox ETP and some browsers generate invalid tokens; score threshold would block legit users)
    if (!data.success) {
      console.warn('[reCAPTCHA] verification failed:', data['error-codes']);
      return;
    }
    console.log('[reCAPTCHA]', JSON.stringify({ success: data.success, score: data.score, action: data.action }));
    if (data.score < 0.1) {
      console.warn('[reCAPTCHA] very low score, possible bot:', data.score);
    }
  }
}

// --- CONTROLADOR DE AUTENTICACIÓN ---
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly webAuthnService: WebAuthnService,
    private readonly faceService: FaceService,
  ) {}

  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Verificar correo electrónico' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('verificar-correo')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token_hash);
  }

  @ApiOperation({ summary: 'Reenviar correo de verificación' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('reenviar-verificacion')
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('olvide-contrasena')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('nueva-contrasena')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token_hash, body.newPassword);
  }

  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.authService.login(loginDto, ip);

    this.setRefreshCookie(res, result.refresh_token);
    return { user: result.user, access_token: result.access_token };
  }

  @ApiOperation({ summary: 'Refrescar access token con refresh cookie' })
  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @ApiCookieAuth('refresh_token')
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No hay refresh token');
    }

    const result = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, result.refresh_token);
    return { access_token: result.access_token };
  }

  @ApiOperation({ summary: 'Cerrar sesión (limpiar refresh cookie)' })
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    return { message: 'Sesion cerrada' };
  }

  // ── WebAuthn ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Obtener opciones de registro WebAuthn' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('webauthn/register/options')
  webauthnRegisterOptions(@Req() req: any) {
    return this.webAuthnService.generateRegistrationOptions(req.user.userId);
  }

  @ApiOperation({ summary: 'Verificar registro de passkey WebAuthn' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('webauthn/register/verify')
  webauthnRegisterVerify(
    @Req() req: any,
    @Body() body: WebAuthnVerifyRegistrationDto,
  ) {
    return this.webAuthnService.verifyRegistration(
      req.user.userId,
      body.registrationResponse as unknown as RegistrationResponseJSON,
    );
  }

  @ApiOperation({ summary: 'Obtener opciones de login WebAuthn' })
  @Post('webauthn/login/options')
  webauthnLoginOptions(@Body('email') email?: string) {
    return this.webAuthnService.generateAuthOptions(email);
  }

  @ApiOperation({ summary: 'Verificar login con passkey WebAuthn' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('webauthn/login/verify')
  async webauthnLoginVerify(
    @Body() body: WebAuthnVerifyAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.webAuthnService.verifyAuthentication(
      body.userId ?? null,
      body.authenticationResponse as unknown as AuthenticationResponseJSON,
    );
    const { password: _p, ...userResult } = user;
    const tokens = await this.authService.issueTokenPair(userResult);
    this.setRefreshCookie(res, tokens.refresh_token);
    return { user: userResult, access_token: tokens.access_token };
  }

  // ── Face (second factor) ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Guardar descriptor facial del usuario' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('face/save')
  saveFaceDescriptor(@Req() req: any, @Body() body: FaceDescriptorDto) {
    return this.faceService.saveDescriptor(req.user.userId, body.descriptor);
  }

  @ApiOperation({ summary: 'Login con contraseña + verificación facial opcional' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login/face')
  async loginWithFace(
    @Body() body: FaceLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.authService.login(body, ip);  // validates password
    const user = result.user as Omit<User, 'password'>;

    if (body.faceDescriptor) {
      const { hasDescriptor, match } = await this.faceService.verifyDescriptor(
        user.id,
        body.faceDescriptor,
      );
      if (hasDescriptor && !match) {
        throw new UnauthorizedException('Rostro no reconocido');
      }
    }

    const tokens = await this.authService.issueTokenPair(user);
    this.setRefreshCookie(res, tokens.refresh_token);
    return { user, access_token: tokens.access_token };
  }

  @ApiOperation({ summary: 'Login solo con rostro (requiere email)' })
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login/face-only')
  async loginFaceOnly(
    @Body() body: FaceOnlyLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.faceService.findUserByFace(body.faceDescriptor, body.email);
    const tokens = await this.authService.issueTokenPair(user);
    this.setRefreshCookie(res, tokens.refresh_token);
    return { user, access_token: tokens.access_token };
  }

  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.authService.findOne(req.user.userId);
  }

  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('profile/update')
  updateProfile(@Req() req: any, @Body() updateData: any) {
    return this.authService.update(req.user.userId, updateData);
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    const isProd = process.env['NODE_ENV'] === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}

// --- MÓDULO DE AUTENTICACIÓN ---
@Module({
  imports: [
    TypeOrmModule.forFeature([User, WebAuthnChallenge]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET no definido en variables de entorno');
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
      inject: [ConfigService],
    }),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, WebAuthnService, FaceService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
