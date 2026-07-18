import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Hairstyle } from '../hairstyles/hairstyles.module';
import { NailDesign } from '../nail-designs/nail-designs.module';
import { Service } from '../services/entities/service.entity';
import { Offer } from '../offers/entities/offer.entity';
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
import { AdminOffersController } from './offers/admin-offers.controller';
import { AdminOffersService } from './offers/admin-offers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Hairstyle, NailDesign, Service, Offer]),
    AuthModule,
  ],
  controllers: [
    AdminController,
    AdminProductsController,
    AdminHairstylesController,
    AdminNailDesignsController,
    AdminServicesController,
    AdminUsersController,
    AdminOffersController,
  ],
  providers: [
    RolesGuard,
    AdminService,
    AdminProductsService,
    AdminHairstylesService,
    AdminNailDesignsService,
    AdminServicesService,
    AdminUsersService,
    AdminOffersService,
  ],
})
export class AdminModule {}
