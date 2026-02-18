import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Configuración de TypeORM para MySQL (XAMPP)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306), // Puerto default de MySQL
        username: configService.get<string>('DB_USERNAME', 'root'), // Usuario default de XAMPP
        password: configService.get<string>('DB_PASSWORD', ''), // Password default vacío en XAMPP
        database: configService.get<string>('DB_NAME', 'ela_beauty'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true), // true solo en desarrollo
        logging: configService.get<boolean>('DB_LOGGING', true),
        autoLoadEntities: true,
        charset: 'utf8mb4', // Para soportar emojis y caracteres especiales
      }),
      inject: [ConfigService],
    }),
    
    // Módulos de la aplicación
    AuthModule,
    ServicesModule,
    ProductsModule,
    AppointmentsModule,
    BlogModule,
    GalleryModule,
    ContactsModule,
    HomeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}