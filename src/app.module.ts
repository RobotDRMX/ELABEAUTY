import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { SupabaseModule } from './supabase/supabase.module';
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
import { AdminModule } from './admin/admin.module';
import { EventsModule } from './events/events.module';

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

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'postgres'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // IMPORTANTE: false por defecto — usar DB_SYNCHRONIZE=true solo en desarrollo
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: configService.get<boolean>('DB_LOGGING', false),
        autoLoadEntities: true,
        ssl: configService.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: !!configService.get<string>('DB_CA_CERT') }
          : false,
      }),
      inject: [ConfigService],
    }),

    SupabaseModule,
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
    AdminModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerGuard aplicado globalmente a todos los endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        'api/docs(.*)',
        'api/auth/login',
        'api/auth/register',
        'api/auth/refresh',
        'api/auth/verificar-correo',
        'api/auth/reenviar-verificacion',
        'api/auth/olvide-contrasena',
        'api/auth/nueva-contrasena',
        'api/auth/login/face',
        'api/auth/login/face-only',
        'api/auth/webauthn/login/options',
        'api/auth/webauthn/login/verify',
        'api/admin/seed-admin',
      )
      .forRoutes('*');
  }
}
