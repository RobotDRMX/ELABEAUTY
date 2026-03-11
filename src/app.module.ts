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
        // IMPORTANTE: false por defecto — usar DB_SYNCHRONIZE=true solo en desarrollo
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
    // ThrottlerGuard aplicado globalmente a todos los endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
