import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
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
  const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:4200');
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        frontendUrl,
        'http://localhost:4200',
        'http://localhost:4300',
      ];
      // Allow all Vercel preview deployments
      if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
