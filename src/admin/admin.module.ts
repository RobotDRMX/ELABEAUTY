import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Hairstyle } from '../hairstyles/hairstyles.module';
import { NailDesign } from '../nail-designs/nail-designs.module';
import { Service } from '../services/entities/service.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';
import { AdminHairstylesController } from './hairstyles/admin-hairstyles.controller';
import { AdminHairstylesService } from './hairstyles/admin-hairstyles.service';
import { AdminNailDesignsController } from './nail-designs/admin-nail-designs.controller';
import { AdminNailDesignsService } from './nail-designs/admin-nail-designs.service';
import { AdminServicesController } from './services/admin-services.controller';
import { AdminServicesService } from './services/admin-services.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Hairstyle, NailDesign, Service]),
  ],
  controllers: [
    AdminController,
    AdminProductsController,
    AdminHairstylesController,
    AdminNailDesignsController,
    AdminServicesController,
    AdminUsersController,
  ],
  providers: [
    AdminService,
    AdminProductsService,
    AdminHairstylesService,
    AdminNailDesignsService,
    AdminServicesService,
    AdminUsersService,
  ],
})
export class AdminModule {}
