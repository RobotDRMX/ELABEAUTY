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
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { WebAuthnService } from './webauthn.service';
import { FaceService } from './face.service';
import {
  WebAuthnVerifyRegistrationDto,
  WebAuthnVerifyAuthDto,
  FaceDescriptorDto,
  FaceLoginDto,
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
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('El usuario ya existe');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password, ...result } = savedUser;
    return result;
  }

  async login(
    loginDto: LoginDto,
    ip: string,
  ): Promise<{
    user: Omit<User, 'password'>;
    access_token: string;
    refresh_token: string;
  }> {
    // Verify reCAPTCHA before any DB query
    await this.verifyRecaptcha(loginDto.recaptchaToken);

    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      console.warn(
        `[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      console.warn(
        `[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const secret = this.configService.get<string>('JWT_SECRET')!;
    const payload = { email: user.email, sub: user.id, role: user.role };

    const access_token = this.jwtService.sign(payload, {
      secret,
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(
      { sub: user.id },
      { secret, expiresIn: '7d' },
    );

    const { password, ...userResult } = user;
    return {
      user: userResult as Omit<User, 'password'>,
      access_token,
      refresh_token,
    };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    const secret = this.configService.get<string>('JWT_SECRET')!;
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const newPayload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(newPayload, {
      secret,
      expiresIn: '15m',
    });

    return { access_token };
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

  // Public method reusable by new biometric endpoints.
  // Signs and returns the token pair; controller writes the cookies.
  issueTokenPair(user: Omit<User, 'password'>): { access_token: string; refresh_token: string } {
    const secret = this.configService.get<string>('JWT_SECRET')!;
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload, { secret, expiresIn: '15m' }),
      refresh_token: this.jwtService.sign({ sub: user.id }, { secret, expiresIn: '7d' }),
    };
  }

  async verifyRecaptcha(token: string): Promise<void> {
    const secret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret || secret === 'YOUR_RECAPTCHA_SECRET_KEY') {
      // Skip verification in dev if key not configured
      console.warn('[Auth] reCAPTCHA secret not configured — skipping verification');
      return;
    }

    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const params = new URLSearchParams({ secret, response: token });

    const { data } = await firstValueFrom(
      this.httpService.post<{ success: boolean; score: number; action: string }>(
        `${url}?${params.toString()}`,
      ),
    );

    if (!data.success || data.score < 0.5) {
      throw new UnauthorizedException('Verificación de seguridad fallida. Inténtalo de nuevo.');
    }
  }
}

// --- CONTROLADOR DE AUTENTICACIÓN ---
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly webAuthnService: WebAuthnService,
    private readonly faceService: FaceService,
  ) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Rate limit estricto: 5 intentos por minuto por IP
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

    this.setCookies(res, result);
    return { user: result.user };
  }

  // Only refreshes access_token. Refresh token rotation is out of scope for this project.
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
    const isProd = process.env['NODE_ENV'] === 'production';

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    return { message: 'Token renovado' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env['NODE_ENV'] === 'production';
    res.clearCookie('access_token', { httpOnly: true, secure: isProduction, sameSite: 'strict' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: 'strict' });
    return { message: 'Sesión cerrada' };
  }

  // ── WebAuthn ──────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('webauthn/register/options')
  webauthnRegisterOptions(@Req() req: any) {
    return this.webAuthnService.generateRegistrationOptions(req.user.userId);
  }

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

  // Returns { options, userId } — client must send userId back in /login/verify
  @Post('webauthn/login/options')
  webauthnLoginOptions(@Body('email') email: string) {
    return this.webAuthnService.generateAuthOptions(email);
  }

  // userId comes from client (returned by /login/options) — never regenerate challenge here
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('webauthn/login/verify')
  async webauthnLoginVerify(
    @Body() body: WebAuthnVerifyAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.webAuthnService.verifyAuthentication(
      body.userId,
      body.authenticationResponse as unknown as AuthenticationResponseJSON,
    );
    const { password: _p, ...userResult } = user;
    this.setCookies(res, this.authService.issueTokenPair(userResult));
    return { user: userResult };
  }

  // ── Face (second factor) ──────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('face/save')
  saveFaceDescriptor(@Req() req: any, @Body() body: FaceDescriptorDto) {
    return this.faceService.saveDescriptor(req.user.userId, body.descriptor);
  }

  // Same as /login but adds face verification if descriptor is sent.
  // If user has no saved face, login proceeds with password only.
  // If user has saved face and descriptor doesn't match, reject.
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
      // Only block if user has a face registered AND it doesn't match
      if (hasDescriptor && !match) {
        throw new UnauthorizedException('Rostro no reconocido');
      }
    }

    this.setCookies(res, this.authService.issueTokenPair(user));
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.authService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/update')
  updateProfile(@Req() req: any, @Body() updateData: any) {
    return this.authService.update(req.user.userId, updateData);
  }

  // Private helper: writes access_token and refresh_token as HttpOnly cookies.
  // Used by all login endpoints (password, WebAuthn, face).
  private setCookies(
    res: Response,
    tokens: { access_token: string; refresh_token: string },
  ): void {
    const isProd = process.env['NODE_ENV'] === 'production';
    const cookieOpts = { httpOnly: true, secure: isProd, sameSite: 'strict' as const };
    res.cookie('access_token',  tokens.access_token,  { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', tokens.refresh_token, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }
}

// --- MÓDULO DE AUTENTICACIÓN ---
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
