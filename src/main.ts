import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar CORS
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL', 'http://localhost:4200'),
      'http://localhost:4300'
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  // Global prefix para API
  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Backend ejecutándose en: http://localhost:${port}`);
  console.log(`📊 Base de datos: MySQL en XAMPP (ela_beauty)`);
}
bootstrap();