# Security & Architecture Improvements — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hardening de seguridad completo del proyecto Ela Beauty: HttpOnly cookies, RBAC, rate limiting, ValidationPipe global, whitelist de sortBy, filtro global de excepciones, e interceptor Angular con auto-refresh.

**Architecture:** Backend primero (NestJS: packages, main.ts, auth refactor, RBAC, products); luego frontend (Angular 17: interceptor, auth.service, guard). Cada chunk es independiente y compilable. Sin cambios en esquema de base de datos (el campo `role` en User ya existe).

**Tech Stack:** NestJS 11, TypeORM, passport-jwt, @nestjs/throttler, helmet, cookie-parser, Angular 17 standalone components, HttpInterceptorFn.

---

## File Map

### New files
- `src/common/filters/global-exception.filter.ts` — Filtro global de excepciones
- `src/common/guards/roles.guard.ts` — Guard de roles
- `src/common/decorators/roles.decorator.ts` — Decorador @Roles()
- `src/users/users.controller.ts` — Endpoint PATCH /users/:id/role
- `frontend/src/app/interceptors/auth.interceptor.ts` — Interceptor HTTP Angular

### Modified files
- `src/main.ts` — ValidationPipe, cookie-parser, helmet, global filters
- `src/app.module.ts` — ThrottlerModule, synchronize false por defecto
- `src/auth/auth.module.ts` — HttpOnly cookies, refresh tokens, rate limiting, incluir role en JWT
- `src/auth/dto/auth.dto.ts` — Contraseña más fuerte (8 chars, mayúscula, número)
- `src/users/users.module.ts` — Exportar UsersController
- `src/products/products.controller.ts` — Agregar JwtAuthGuard + @Roles('admin')
- `src/products/products.service.ts` — Whitelist en sortBy
- `frontend/src/app/services/auth.service.ts` — Eliminar localStorage, usar cookies
- `frontend/src/app/guards/auth.guard.ts` — Validación async contra backend
- `frontend/src/app/app.config.ts` — Registrar interceptor

---

## Chunk 1: Foundation — Packages, main.ts, Exception Filter, app.module.ts

### Task 1: Instalar dependencias del backend

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar paquetes**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
npm install @nestjs/throttler helmet cookie-parser
npm install -D @types/cookie-parser
```

Expected output: packages added, no errors.

- [ ] **Step 2: Verificar instalación**

```bash
node -e "require('@nestjs/throttler'); require('helmet'); require('cookie-parser'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install throttler, helmet, cookie-parser"
```

---

### Task 2: Crear filtro global de excepciones

**Files:**
- Create: `src/common/filters/global-exception.filter.ts`

- [ ] **Step 1: Crear directorio y archivo**

```typescript
// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as any).message;
      message = Array.isArray(msg) ? msg.join(', ') : msg;
    } else if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'Error interno del servidor';
    } else {
      message = 'Error desconocido';
    }

    // En desarrollo, loguear el error completo
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalExceptionFilter]', exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
npx tsc --noEmit
```

Expected: sin errores de compilación.

- [ ] **Step 3: Commit**

```bash
git add src/common/filters/global-exception.filter.ts
git commit -m "feat: add GlobalExceptionFilter for normalized error responses"
```

---

### Task 3: Actualizar main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Reemplazar contenido de main.ts**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Seguridad: headers HTTP
  app.use(helmet());

  // Cookies HttpOnly
  app.use(cookieParser());

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtro global de excepciones
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL', 'http://localhost:4200'),
      'http://localhost:4300',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`Backend ejecutándose en: http://localhost:${port}`);
  console.log(`Base de datos: MySQL en XAMPP (ela_beauty)`);
}
bootstrap();
```

- [ ] **Step 2: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: add ValidationPipe, helmet, cookie-parser, GlobalExceptionFilter to main.ts"
```

---

### Task 4: Actualizar app.module.ts

**Files:**
- Modify: `src/app.module.ts`

- [ ] **Step 1: Agregar ThrottlerModule y corregir synchronize**

Reemplazar el contenido de `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { BlogModule } from './blog/blog.module';
import { GalleryModule } from './gallery/gallery.module';
import { ContactsModule } from './contacts/contacts.module';
import { HomeModule } from './home/home.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CartModule } from './cart/cart.module';
import { HairstylesModule } from './hairstyles/hairstyles.module';
import { NailDesignsModule } from './nail-designs/nail-designs.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting global: 100 peticiones por minuto por defecto
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'ela_beauty'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // IMPORTANTE: false por defecto — usar migraciones en producción
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: configService.get<boolean>('DB_LOGGING', false),
        autoLoadEntities: true,
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    ServicesModule,
    ProductsModule,
    AppointmentsModule,
    BlogModule,
    GalleryModule,
    ContactsModule,
    HomeModule,
    FavoritesModule,
    CartModule,
    HairstylesModule,
    NailDesignsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerGuard aplicado globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Agregar DB_SYNCHRONIZE=true al .env para desarrollo**

Agregar al archivo `.env`:
```
DB_SYNCHRONIZE=true
```

> ⚠️ En producción, esta línea debe ser `DB_SYNCHRONIZE=false` o eliminarse.

- [ ] **Step 3: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app.module.ts
git commit -m "feat: add ThrottlerModule global rate limiting, fix synchronize default to false"
```

---

## Chunk 2: Auth Module — HttpOnly Cookies + Refresh Tokens + Rate Limiting

### Task 5: Actualizar auth.dto.ts — Password más fuerte

**Files:**
- Modify: `src/auth/dto/auth.dto.ts`

- [ ] **Step 1: Actualizar validaciones**

```typescript
// src/auth/dto/auth.dto.ts
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  password!: string;
}

export class UpdateRoleDto {
  @IsString()
  role!: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/dto/auth.dto.ts
git commit -m "feat: strengthen password validation (8 chars, uppercase, number)"
```

---

### Task 6: Refactorizar auth.module.ts — HttpOnly cookies + refresh tokens + rate limiting

**Files:**
- Modify: `src/auth/auth.module.ts`

- [ ] **Step 1: Verificar que JWT_SECRET está en .env**

El archivo `.env` debe tener:
```
JWT_SECRET=<cadena aleatoria de al menos 64 caracteres>
```

Para generar un secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copiar la salida y pegarlo como valor de `JWT_SECRET` en `.env`. Si `JWT_SECRET` no está definido, el servidor no debe arrancar.

- [ ] **Step 2: Reemplazar auth.module.ts completo**

```typescript
// src/auth/auth.module.ts
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

// --- ESTRATEGIA JWT (lee token de cookie) ---
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
          return (request?.cookies as Record<string, string>)?.access_token ?? null;
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

  async login(loginDto: LoginDto, ip: string): Promise<{
    user: Omit<User, 'password'>;
    access_token: string;
    refresh_token: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      // Log intento fallido sin revelar si el email existe
      console.warn(`[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Login fallido — email: ${loginDto.email} — IP: ${ip}`);
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
    return { user: userResult as Omit<User, 'password'>, access_token, refresh_token };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    const secret = this.configService.get<string>('JWT_SECRET')!;
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
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
    const { password, role, ...safeData } = updateData;
    await this.userRepository.update(id, safeData);
    return this.findOne(id);
  }

  async updateRole(id: number, role: string) {
    if (!['user', 'admin'].includes(role)) {
      throw new BadRequestException('Rol inválido. Valores permitidos: user, admin');
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
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const result = await this.authService.login(loginDto, ip);

    const isProduction = process.env.NODE_ENV === 'production';

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
    const refreshToken = cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No hay refresh token');
    }

    const result = await this.authService.refresh(refreshToken);
    const isProduction = process.env.NODE_ENV === 'production';

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
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
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
          throw new Error('JWT_SECRET no definido');
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
```

- [ ] **Step 3: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Probar arranque del servidor**

```bash
npm run start:dev
```

Expected: servidor arranca sin errores. Si `JWT_SECRET` no está en `.env`, debe mostrar un error claro y no arrancar.

- [ ] **Step 5: Commit**

```bash
git add src/auth/auth.module.ts
git commit -m "feat: refactor auth to HttpOnly cookies, dual tokens (15m/7d), rate limiting on login, fail-fast JWT_SECRET"
```

---

## Chunk 3: RBAC — Roles Guard + Users Controller

### Task 7: Crear decorador @Roles y RolesGuard

**Files:**
- Create: `src/common/decorators/roles.decorator.ts`
- Create: `src/common/guards/roles.guard.ts`

- [ ] **Step 1: Crear decorador**

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 2: Crear guard**

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no tiene @Roles(), permite acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // user viene del JwtStrategy.validate() que incluye role
    return requiredRoles.some((role) => user?.role === role);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/common/decorators/roles.decorator.ts src/common/guards/roles.guard.ts
git commit -m "feat: add @Roles decorator and RolesGuard for RBAC"
```

---

### Task 8: Crear UsersController con endpoint PATCH /users/:id/role

**Files:**
- Create: `src/users/users.controller.ts`
- Modify: `src/users/users.module.ts`

- [ ] **Step 1: Crear users.controller.ts**

```typescript
// src/users/users.controller.ts
import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, AuthService } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateRoleDto } from '../auth/dto/auth.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.authService.updateRole(+id, updateRoleDto.role);
  }
}
```

- [ ] **Step 2: Actualizar users.module.ts**

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  controllers: [UsersController],
  exports: [TypeOrmModule],
})
export class UsersModule {}
```

- [ ] **Step 3: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/users/users.controller.ts src/users/users.module.ts
git commit -m "feat: add PATCH /users/:id/role endpoint restricted to admin role"
```

---

## Chunk 4: Products Security — sortBy Whitelist + Endpoint Guards

### Task 9: Whitelist de sortBy en ProductsService

**Files:**
- Modify: `src/products/products.service.ts`

- [ ] **Step 1: Agregar whitelist antes del orderBy**

En el método `search()` de `products.service.ts`, localizar la línea:
```typescript
const products = await queryBuilder
  .orderBy(`product.${sortBy}`, order)
```

Reemplazar con:
```typescript
const ALLOWED_SORT_COLUMNS = ['name', 'price', 'rating', 'created_at', 'stock'];
const safeSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';

const products = await queryBuilder
  .orderBy(`product.${safeSortBy}`, order)
```

- [ ] **Step 2: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/products/products.service.ts
git commit -m "fix: whitelist sortBy column to prevent SQL injection"
```

---

### Task 10: Proteger endpoints de productos con auth + roles

**Files:**
- Modify: `src/products/products.controller.ts`

- [ ] **Step 1: Actualizar products.controller.ts**

```typescript
// src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import { JwtAuthGuard } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Solo admin puede crear productos
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('search')
  search(@Query() searchDto: SearchProductDto) {
    return this.productsService.search(searchDto);
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('featured')
  getFeaturedProducts(@Query('limit') limit: number = 8) {
    return this.productsService.getFeaturedProducts(limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // Solo admin puede ejecutar seed
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  seedProducts() {
    return this.productsService.seedProducts();
  }
}
```

- [ ] **Step 2: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 3: Probar que el servidor arranca**

```bash
npm run start:dev
```

Expected: sin errores de importación circular o módulos faltantes.

- [ ] **Step 4: Commit**

```bash
git add src/products/products.controller.ts
git commit -m "feat: protect POST /products and POST /products/seed with JwtAuthGuard + admin role"
```

---

## Chunk 5: Frontend — Interceptor + AuthService + Guard

### Task 11: Crear AuthInterceptor

**Files:**
- Create: `frontend/src/app/interceptors/auth.interceptor.ts`

- [ ] **Step 1: Crear el interceptor**

```typescript
// frontend/src/app/interceptors/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  // Agregar withCredentials a todas las peticiones
  const reqWithCredentials = req.clone({ withCredentials: true });

  return next(reqWithCredentials).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo intentar refresh si es 401 y no es un endpoint de auth
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register') &&
        !req.url.includes('/auth/refresh') &&
        !isRefreshing
      ) {
        isRefreshing = true;
        const http = inject(HttpClient);
        const router = inject(Router);

        return http
          .post(
            'http://localhost:3000/api/auth/refresh',
            {},
            { withCredentials: true },
          )
          .pipe(
            switchMap(() => {
              isRefreshing = false;
              // Reintentar la petición original con las nuevas cookies
              return next(reqWithCredentials);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              // Si el refresh también falla, redirigir al login
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            }),
          );
      }

      return throwError(() => error);
    }),
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/interceptors/auth.interceptor.ts
git commit -m "feat: add Angular AuthInterceptor with withCredentials and auto-refresh on 401"
```

---

### Task 12: Actualizar AuthService — eliminar localStorage

**Files:**
- Modify: `frontend/src/app/services/auth.service.ts`

- [ ] **Step 1: Reemplazar auth.service.ts**

```typescript
// frontend/src/app/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkSession();
  }

  private checkSession() {
    // Verificar sesión activa consultando al backend (usa cookie automáticamente)
    this.http
      .get(`${this.apiUrl}/profile`, { withCredentials: true })
      .subscribe({
        next: (user: any) => {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          sessionStorage.setItem('user', JSON.stringify(user));
        },
        error: () => {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          sessionStorage.removeItem('user');
        },
      });
  }

  login(credentials: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((res: any) => {
          this.currentUser.set(res.user);
          this.isAuthenticated.set(true);
          sessionStorage.setItem('user', JSON.stringify(res.user));
        }),
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, {
      withCredentials: true,
    });
  }

  logout() {
    // Limpiar cookies en el servidor
    this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe();
    sessionStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  getProfile(): Observable<any> {
    // withCredentials lo agrega el interceptor automáticamente
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/update`, data);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/services/auth.service.ts
git commit -m "feat: replace localStorage token storage with HttpOnly cookies in AuthService"
```

---

### Task 13: Actualizar AuthGuard — validación async contra backend

**Files:**
- Modify: `frontend/src/app/guards/auth.guard.ts`

- [ ] **Step 1: Reemplazar auth.guard.ts**

```typescript
// frontend/src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Validar sesión contra el backend (no confiar solo en estado local)
  return authService.getProfile().pipe(
    map((user: any) => {
      authService.currentUser.set(user);
      authService.isAuthenticated.set(true);
      return true;
    }),
    catchError(() => {
      authService.currentUser.set(null);
      authService.isAuthenticated.set(false);
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
      return of(false);
    }),
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/guards/auth.guard.ts
git commit -m "feat: make authGuard async, validate session against backend instead of local signal"
```

---

### Task 14: Registrar interceptor en app.config.ts

**Files:**
- Modify: `frontend/src/app/app.config.ts`

- [ ] **Step 1: Agregar interceptor a providers**

```typescript
// frontend/src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]),
    ),
  ],
};
```

- [ ] **Step 2: Verificar que el frontend compila**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty/frontend"
npx ng build --configuration development 2>&1 | tail -20
```

Expected: `Application bundle generation complete.` sin errores.

- [ ] **Step 3: Commit final**

```bash
git add frontend/src/app/app.config.ts
git commit -m "feat: register AuthInterceptor in Angular app config"
```

---

## Verificación Final

- [ ] **Arrancar backend**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
npm run start:dev
```

Expected: servidor en puerto 3000 sin errores.

- [ ] **Arrancar frontend**

```bash
npm run frontend
```

Expected: Angular en puerto 4200 sin errores de compilación.

- [ ] **Probar login**

Abrir DevTools > Network. Hacer login desde la UI.
Expected:
- La respuesta de `/api/auth/login` NO incluye `access_token` en el body
- Las cookies `access_token` y `refresh_token` aparecen en la pestaña Cookies con `HttpOnly: true`
- No hay entradas en `localStorage` con tokens

- [ ] **Probar protección de endpoints**

```bash
# Sin token — debe retornar 401
curl -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"test","description":"d","price":10,"category":"c","stock":5}'

# Seed sin token — debe retornar 401
curl -X POST http://localhost:3000/api/products/seed
```

Expected: ambos retornan `{ "statusCode": 401, "message": "Unauthorized", ... }`

- [ ] **Probar rate limiting**

```bash
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test1234!"}'
done
```

Expected: primeros 5 retornan 200 o 401; el 6to retorna 429 (Too Many Requests).

- [ ] **Probar sortBy inválido**

```bash
curl "http://localhost:3000/api/products/search?sortBy=id;DROP TABLE users"
```

Expected: respuesta normal con productos ordenados por `created_at` (fallback silencioso).
