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
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';

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
}

// --- CONTROLADOR DE AUTENTICACIÓN ---
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

    const isProduction = process.env['NODE_ENV'] === 'production';

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return { user: result.user };
  }

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
    const isProduction = process.env['NODE_ENV'] === 'production';

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: isProduction,
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
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
