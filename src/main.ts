import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Seguridad: headers HTTP con helmet
  // Swagger UI necesita scripts/estilos inline, así que usa una CSP más relajada.
  // El resto de la API usa una CSP estricta.
  const helmetStrict = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
  const helmetSwagger = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
  app.use((req: any, res: any, next: any) => {
    if (req.url.startsWith('/api/docs')) return helmetSwagger(req, res, next);
    helmetStrict(req, res, next);
  });

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
  const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:4200');
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = [
        frontendUrl,
        'http://localhost:4200',
        'http://localhost:4300',
      ];
      // Allow only ela-beauty Vercel preview deployments (not arbitrary *.vercel.app)
      const isAllowedPreview = origin && /^https:\/\/ela-beauty(-[a-z0-9]+)*\.vercel\.app$/.test(origin);
      if (!origin || allowed.includes(origin) || isAllowedPreview) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With, X-XSRF-TOKEN',
  });

  app.setGlobalPrefix('api');

  // ── Swagger ──────────────────────────────────────────────────────────────
  // Solo disponible en desarrollo. En producción se deshabilita para no
  // exponer la estructura de la API a posibles atacantes.
  const isProd = configService.get<string>('NODE_ENV') === 'production';

  if (!isProd) {
    const backendUrl = configService.get<string>('BACKEND_URL', `http://localhost:${configService.get('PORT', 3000)}`);
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ELA Beauty API')
      .setDescription(
        'API del salón de belleza ELA Beauty.\n\n' +
        '**Auth:** Los endpoints protegidos requieren un Bearer token. ' +
        'Haz login primero, copia el `access_token` de la respuesta, ' +
        'y pégalo en el botón "Authorize" 🔒 de arriba.'
      )
      .setVersion('1.0')
      .addServer(backendUrl, 'Servidor actual')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`Backend ejecutándose en: http://localhost:${port}`);
  if (!isProd) {
    console.log(`Swagger UI: http://localhost:${port}/api/docs`);
    console.log(`OpenAPI JSON: http://localhost:${port}/api/docs-json`);
  }
}
bootstrap();
