# Admin Panel — Backend API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete backend CRUD API for admin panel covering Products, Hairstyles, Nail Designs, Services, and Users — all protected with JWT + admin role, with soft/hard delete, pagination, and seed-admin endpoint.

**Architecture:** Single `AdminModule` at `src/admin/` grouping all admin controllers. Each entity gets its own controller/service pair inside `src/admin/<entity>/`. Reuses existing `JwtAuthGuard` (from `AuthModule`), `@Roles` decorator and `RolesGuard` (from `src/common/`). Hard delete only allowed after soft delete.

**Tech Stack:** NestJS 11, TypeORM, MySQL, class-validator, class-transformer, bcrypt.

**Soft-delete fields by entity:**
- `products` → `is_active` (boolean, snake_case)
- `peinados` (hairstyles) → `is_available` (boolean, snake_case)
- `nail_designs` → `is_available` (boolean, snake_case)
- `services` → `isActive` (boolean, camelCase)
- `users` → `isActive` (boolean, camelCase)

---

## File Map

### New files
```
ela-beauty-admin.sql                                   ← SQL seed script
src/admin/
  admin.module.ts                                      ← imports all sub-controllers
  admin.controller.ts                                  ← POST /admin/seed-admin
  admin.service.ts                                     ← seed-admin logic
  dto/
    admin-list.dto.ts                                  ← shared pagination DTO
  products/
    admin-products.controller.ts
    admin-products.service.ts
    dto/update-product.dto.ts
  hairstyles/
    admin-hairstyles.controller.ts
    admin-hairstyles.service.ts
    dto/create-hairstyle.dto.ts
    dto/update-hairstyle.dto.ts
  nail-designs/
    admin-nail-designs.controller.ts
    admin-nail-designs.service.ts
    dto/create-nail-design.dto.ts
    dto/update-nail-design.dto.ts
  services/
    admin-services.controller.ts
    admin-services.service.ts
    dto/create-service.dto.ts
    dto/update-service.dto.ts
  users/
    admin-users.controller.ts
    admin-users.service.ts
```

### Modified files
```
src/services/services.module.ts          ← scaffold from empty stub to full module
src/services/entities/service.entity.ts ← fix missing ! on required fields
src/app.module.ts                        ← add AdminModule to imports
```

---

## Chunk 1: SQL Script + ServicesModule Scaffold

### Task 1: Generate SQL seed script

**Files:**
- Create: `ela-beauty-admin.sql`

- [ ] **Step 1: Generate a fresh bcrypt hash for `Admin@Ela2026`**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin@Ela2026', 12).then(h => console.log(h))"
```

Copy the output — it will be used as `<BCRYPT_HASH>` in Step 2.

- [ ] **Step 2: Create `ela-beauty-admin.sql`**

Replace `<BCRYPT_HASH>` with the hash from Step 1:

```sql
-- ============================================================
-- ELA BEAUTY — Admin Seed Script
-- Run in XAMPP phpMyAdmin or MySQL CLI
-- Safe to run multiple times (uses INSERT IGNORE / IF NOT EXISTS)
-- ⚠️  Change admin password after first login!
-- ============================================================

USE ela_beauty;

-- ── 1. ADMIN USER ──────────────────────────────────────────
-- Password: Admin@Ela2026 (bcrypt 12 rounds)
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN
INSERT INTO users (email, password, firstName, lastName, role, isActive, createdAt, updatedAt)
SELECT
  'admin@elabeauty.com',
  '<BCRYPT_HASH>',
  'Admin',
  'ELA Beauty',
  'admin',
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE role = 'admin' AND isActive = 1
);

-- ── 2. PRODUCTOS (sample data) ─────────────────────────────
INSERT IGNORE INTO products (name, description, price, category, subcategory, stock, image_url, is_active, rating, review_count, target_age, created_at, updated_at) VALUES
('SuperStay Matte Ink', 'Labial líquido mate de larga duración, hasta 16 horas de color intenso.', 249.00, 'Labiales', 'Líquidos', 50, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600', 1, 4.8, 1250, 'Todas', NOW(), NOW()),
('Sky High Mascara', 'Pestañas con un volumen redefinido y longitud sin límites.', 199.00, 'Ojos', 'Máscaras', 75, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', 1, 4.9, 850, 'Jóvenes', NOW(), NOW()),
('Fit Me Foundation', 'Base de maquillaje que matifica y refina los poros.', 299.00, 'Rostro', 'Bases', 40, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600', 1, 4.7, 2100, 'Todas', NOW(), NOW()),
('Baby Lips Lip Balm', 'Bálsamo labial hidratante para labios suaves.', 79.00, 'Labiales', 'Bálsamos', 120, 'https://images.unsplash.com/photo-1599733594230-6b823276abcc?w=600', 1, 4.5, 500, 'Adolescentes', NOW(), NOW()),
('Brow Fast Sculpt', 'Gel con color para cejas, peina y rellena en un solo paso.', 159.00, 'Ojos', 'Cejas', 45, 'https://images.unsplash.com/photo-1591360236630-4e9432657e2d?w=600', 1, 4.4, 210, 'Todas', NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ── 3. PEINADOS ────────────────────────────────────────────
INSERT IGNORE INTO peinados (name, description, process, duration, price, category, image_url, is_available, createdAt, updatedAt) VALUES
('Corte Bob Moderno', 'Corte bob clásico con líneas limpias y acabado brillante.', 'Lavado, corte en seco, peinado con secadora y plancha.', '45 min', 320.00, 'Cortes', 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600', 1, NOW(), NOW()),
('Balayage Caramel', 'Técnica de coloración degradada con tonos caramel naturales.', 'Aplicación de decolorante, tinte balayage, neutralización y acabado con aceite de argán.', '180 min', 1200.00, 'Coloración', 'https://images.unsplash.com/photo-1562594980-47dc9f44e4d3?w=600', 1, NOW(), NOW()),
('Trenzas Boho', 'Trenzas bohemias con acabado natural y romántico.', 'Lavado, acondicionado profundo, trenzado artesanal con fijador ligero.', '90 min', 450.00, 'Peinados', 'https://images.unsplash.com/photo-1583366701490-647f5716f9e7?w=600', 1, NOW(), NOW()),
('Recogido Elegante', 'Recogido sofisticado ideal para eventos formales.', 'Lavado, secado, ondas con plancha y armado del recogido con fijador fuerte.', '60 min', 380.00, 'Peinados', 'https://images.unsplash.com/photo-1580618864194-0fb637d2e7b4?w=600', 1, NOW(), NOW()),
('Alisado Keratina', 'Tratamiento de alisado semipermanente con queratina brasileña.', 'Lavado profundo, aplicación de queratina, sellado con plancha a 230°C.', '240 min', 1500.00, 'Tratamientos', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- ── 4. NAIL DESIGNS ────────────────────────────────────────
INSERT IGNORE INTO nail_designs (name, description, process, duration, price, style, image_url, is_available, createdAt, updatedAt) VALUES
('French Clásico', 'Manicura francesa tradicional con punta blanca perfecta.', 'Limpieza de cutícula, base protectora, esmalte nude, punta blanca, top coat.', '45 min', 180.00, 'Clásico', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', 1, NOW(), NOW()),
('Gel Holográfico', 'Diseño con efecto holográfico multicolor en gel.', 'Preparación de uña, base gel, color holográfico, diseño con pigmento, curado en lámpara UV.', '75 min', 350.00, 'Tendencia', 'https://images.unsplash.com/photo-1604654894653-9e677873f6c8?w=600', 1, NOW(), NOW()),
('Nail Art Floral', 'Diseños florales pintados a mano con esmalte acrílico.', 'Base color, diseño floral con pincel fino, detalles con dotting tool, top coat brillante.', '90 min', 420.00, 'Arte', 'https://images.unsplash.com/photo-1604654894792-56df3a8ebc31?w=600', 1, NOW(), NOW()),
('Uñas Acrílicas', 'Extensión de uñas con acrílico para mayor longitud y resistencia.', 'Preparación, colocación de tips, aplicación de acrílico, limado y pulido, esmaltado.', '120 min', 550.00, 'Extensiones', 'https://images.unsplash.com/photo-1604654894825-5b91f7fc5fa2?w=600', 1, NOW(), NOW()),
('Chrome Powder', 'Efecto espejo metálico con polvo chrome sobre gel.', 'Base gel color, curado, frotado de polvo chrome, top coat sin limpieza.', '60 min', 280.00, 'Tendencia', 'https://images.unsplash.com/photo-1604654894862-d7c97b02e0f3?w=600', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- ── 5. SERVICES ────────────────────────────────────────────
INSERT IGNORE INTO services (id, name, description, price, duration, category, imageUrl, isActive, createdAt, updatedAt) VALUES
(UUID(), 'Limpieza Facial Profunda', 'Limpieza facial completa con extracción de impurezas y mascarilla hidratante.', 350.00, 60, 'facial', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600', 1, NOW(), NOW()),
(UUID(), 'Masaje Relajante', 'Masaje de cuerpo completo con aceites esenciales para reducir tensión muscular.', 450.00, 60, 'masajes', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600', 1, NOW(), NOW()),
(UUID(), 'Manicura Spa', 'Manicura completa con exfoliación, hidratación y esmalte a elección.', 220.00, 45, 'manicure', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', 1, NOW(), NOW()),
(UUID(), 'Pedicura Relajante', 'Pedicura con baño de pies, exfoliación, hidratación y esmaltado.', 280.00, 60, 'pedicure', 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=600', 1, NOW(), NOW()),
(UUID(), 'Tratamiento Corporal Reafirmante', 'Tratamiento corporal con fango y vendas reafirmantes para reducir medidas.', 680.00, 90, 'corporal', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

SELECT 'Script ejecutado correctamente. Credenciales admin: admin@elabeauty.com / Admin@Ela2026' AS resultado;
SELECT 'IMPORTANTE: Cambia la contraseña del admin despues del primer login.' AS aviso;
```

- [ ] **Step 3: Commit**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
git add ela-beauty-admin.sql
git commit -m "feat: add admin SQL seed script with admin user, products, hairstyles, nail designs, services"
```

---

### Task 2: Scaffold ServicesModule (fix empty stub)

**Files:**
- Modify: `src/services/entities/service.entity.ts`
- Modify: `src/services/services.module.ts`

- [ ] **Step 1: Fix service.entity.ts — add `!` to required fields and proper decorators**

```typescript
// src/services/entities/service.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column()
  duration!: number; // en minutos

  @Column({
    type: 'enum',
    enum: ['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure'],
    default: 'facial',
  })
  category!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

- [ ] **Step 2: Scaffold services.module.ts with full CRUD-ready structure**

```typescript
// src/services/services.module.ts
import { Module, Injectable, Controller, Get, NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  findAll() {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const service = await this.repo.findOne({ where: { id } });
    if (!service) throw new NotFoundException(`Servicio #${id} no encontrado`);
    return service;
  }
}

@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [TypeOrmModule, ServicesService],
})
export class ServicesModule {}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "C:/xampp/htdocs/Dessarrollo Web Profesional/ela-beauty"
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: no errors related to `services`.

- [ ] **Step 4: Commit**

```bash
git add src/services/entities/service.entity.ts src/services/services.module.ts
git commit -m "feat: scaffold ServicesModule with entity fix and public GET endpoint"
```

---

## Chunk 2: AdminModule Skeleton + Seed-Admin

### Task 3: Create AdminModule with seed-admin endpoint

**Files:**
- Create: `src/admin/dto/admin-list.dto.ts`
- Create: `src/admin/admin.service.ts`
- Create: `src/admin/admin.controller.ts`
- Create: `src/admin/admin.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create shared pagination DTO**

```typescript
// src/admin/dto/admin-list.dto.ts
import { IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminListDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  showInactive?: boolean = false;
}
```

- [ ] **Step 2: Create admin.service.ts**

```typescript
// src/admin/admin.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async seedAdmin(): Promise<{ message: string; email: string }> {
    const existing = await this.userRepo.findOne({
      where: { role: 'admin', isActive: true },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un administrador activo. No se puede volver a ejecutar el seed.',
      );
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@Ela2026', salt);

    const admin = this.userRepo.create({
      email: 'admin@elabeauty.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'ELA Beauty',
      role: 'admin',
      isActive: true,
    });

    await this.userRepo.save(admin);

    return {
      message: 'Administrador creado. Cambia la contraseña después del primer login.',
      email: 'admin@elabeauty.com',
    };
  }
}
```

- [ ] **Step 3: Create admin.controller.ts**

```typescript
// src/admin/admin.controller.ts
import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Endpoint de primer uso — crea admin si no existe ninguno
  // No requiere auth (primer arranque del sistema)
  @Post('seed-admin')
  @HttpCode(HttpStatus.CREATED)
  seedAdmin() {
    return this.adminService.seedAdmin();
  }
}
```

- [ ] **Step 4: Create admin.module.ts (skeleton — se expandirá en tareas siguientes)**

```typescript
// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
```

- [ ] **Step 5: Register AdminModule in app.module.ts**

Add `AdminModule` to the imports array in `src/app.module.ts`:

```typescript
import { AdminModule } from './admin/admin.module';
// ... in @Module imports array:
AdminModule,
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

- [ ] **Step 7: Start server and test seed-admin**

```bash
npm run start:dev
```

In a new terminal:
```bash
# First call — should create admin
curl -s -X POST http://localhost:3000/api/admin/seed-admin | python -m json.tool

# Second call — should return 409
curl -s -X POST http://localhost:3000/api/admin/seed-admin | python -m json.tool
```

Expected first call: `{ "message": "Administrador creado...", "email": "admin@elabeauty.com" }`
Expected second call: `{ "statusCode": 409, "message": "Ya existe un administrador activo..." }`

- [ ] **Step 8: Commit**

```bash
git add src/admin/ src/app.module.ts
git commit -m "feat: add AdminModule with seed-admin endpoint and AdminListDto"
```

---

## Chunk 3: Admin Products CRUD

### Task 4: Admin Products controller + service + DTO

**Files:**
- Create: `src/admin/products/dto/update-product.dto.ts`
- Create: `src/admin/products/admin-products.service.ts`
- Create: `src/admin/products/admin-products.controller.ts`
- Modify: `src/admin/admin.module.ts`

- [ ] **Step 1: Create UpdateProductDto**

```typescript
// src/admin/products/dto/update-product.dto.ts
import { IsString, IsNumber, IsUrl, IsOptional, Min, Max, IsBoolean } from 'class-validator';

export class UpdateProductDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() subcategory?: string;
  @IsNumber() @Min(0) @IsOptional() stock?: number;
  @IsUrl() @IsOptional() image_url?: string;
  @IsNumber() @Min(0) @Max(5) @IsOptional() rating?: number;
  @IsString() @IsOptional() target_age?: string;
}
```

- [ ] **Step 2: Create admin-products.service.ts**

```typescript
// src/admin/products/admin-products.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { is_active: true };
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async deactivate(id: number): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    if (!product.is_active) throw new BadRequestException('El producto ya está desactivado');
    product.is_active = false;
    return this.repo.save(product);
  }

  async restore(id: number): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    if (product.is_active) throw new BadRequestException('El producto ya está activo');
    product.is_active = true;
    return this.repo.save(product);
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    if (product.is_active) {
      throw new BadRequestException(
        'Debes desactivar el producto antes de eliminarlo permanentemente',
      );
    }
    await this.repo.delete(id);
    return { message: `Producto #${id} eliminado permanentemente` };
  }
}
```

- [ ] **Step 3: Create admin-products.controller.ts**

```typescript
// src/admin/products/admin-products.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  findAll(@Query() dto: AdminListDto) {
    return this.service.findAll(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deactivate(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
```

- [ ] **Step 4: Register in admin.module.ts**

Replace `src/admin/admin.module.ts`:

```typescript
// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product]),
  ],
  controllers: [AdminController, AdminProductsController],
  providers: [AdminService, AdminProductsService],
})
export class AdminModule {}
```

- [ ] **Step 5: Verify and test**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

```bash
# Get token first (login as admin)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@elabeauty.com","password":"Admin@Ela2026"}' | python -m json.tool)

# List products (admin sees all including inactive)
curl -s -b cookies.txt "http://localhost:3000/api/admin/products?showInactive=true" | python -m json.tool

# Deactivate product 1
curl -s -b cookies.txt -X PATCH http://localhost:3000/api/admin/products/1/deactivate | python -m json.tool

# Restore product 1
curl -s -b cookies.txt -X PATCH http://localhost:3000/api/admin/products/1/restore | python -m json.tool
```

- [ ] **Step 6: Commit**

```bash
git add src/admin/
git commit -m "feat: add Admin Products CRUD with soft/hard delete"
```

---

## Chunk 4: Admin Hairstyles + Nail Designs CRUD

### Task 5: Admin Hairstyles CRUD

**Files:**
- Create: `src/admin/hairstyles/dto/create-hairstyle.dto.ts`
- Create: `src/admin/hairstyles/dto/update-hairstyle.dto.ts`
- Create: `src/admin/hairstyles/admin-hairstyles.service.ts`
- Create: `src/admin/hairstyles/admin-hairstyles.controller.ts`
- Modify: `src/admin/admin.module.ts`

- [ ] **Step 1: Create Hairstyle DTOs**

```typescript
// src/admin/hairstyles/dto/create-hairstyle.dto.ts
import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class CreateHairstyleDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsString() process!: string;
  @IsString() @IsOptional() duration?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() category?: string;
  @IsUrl() @IsOptional() image_url?: string;
}
```

```typescript
// src/admin/hairstyles/dto/update-hairstyle.dto.ts
import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class UpdateHairstyleDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() process?: string;
  @IsString() @IsOptional() duration?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() category?: string;
  @IsUrl() @IsOptional() image_url?: string;
}
```

- [ ] **Step 2: Create admin-hairstyles.service.ts**

```typescript
// src/admin/hairstyles/admin-hairstyles.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hairstyle } from '../../hairstyles/hairstyles.module';
import { CreateHairstyleDto } from './dto/create-hairstyle.dto';
import { UpdateHairstyleDto } from './dto/update-hairstyle.dto';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminHairstylesService {
  constructor(
    @InjectRepository(Hairstyle)
    private readonly repo: Repository<Hairstyle>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { is_available: true };
    const [data, total] = await this.repo.findAndCount({
      where, skip, take: limit, order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateHairstyleDto): Promise<Hairstyle> {
    const item = this.repo.create(dto);
    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateHairstyleDto): Promise<Hairstyle> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async deactivate(id: number): Promise<Hairstyle> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    if (!item.is_available) throw new BadRequestException('El peinado ya está desactivado');
    item.is_available = false;
    return this.repo.save(item);
  }

  async restore(id: number): Promise<Hairstyle> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    if (item.is_available) throw new BadRequestException('El peinado ya está activo');
    item.is_available = true;
    return this.repo.save(item);
  }

  async remove(id: number): Promise<{ message: string }> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Peinado #${id} no encontrado`);
    if (item.is_available) {
      throw new BadRequestException('Desactiva el peinado antes de eliminarlo permanentemente');
    }
    await this.repo.delete(id);
    return { message: `Peinado #${id} eliminado permanentemente` };
  }
}
```

- [ ] **Step 3: Create admin-hairstyles.controller.ts**

```typescript
// src/admin/hairstyles/admin-hairstyles.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminHairstylesService } from './admin-hairstyles.service';
import { CreateHairstyleDto } from './dto/create-hairstyle.dto';
import { UpdateHairstyleDto } from './dto/update-hairstyle.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/hairstyles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminHairstylesController {
  constructor(private readonly service: AdminHairstylesService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateHairstyleDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHairstyleDto) { return this.service.update(id, dto); }
  @Patch(':id/deactivate') deactivate(@Param('id', ParseIntPipe) id: number) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id', ParseIntPipe) id: number) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
```

---

### Task 6: Admin Nail Designs CRUD

**Files:**
- Create: `src/admin/nail-designs/dto/create-nail-design.dto.ts`
- Create: `src/admin/nail-designs/dto/update-nail-design.dto.ts`
- Create: `src/admin/nail-designs/admin-nail-designs.service.ts`
- Create: `src/admin/nail-designs/admin-nail-designs.controller.ts`
- Modify: `src/admin/admin.module.ts`

- [ ] **Step 1: Create Nail Design DTOs**

```typescript
// src/admin/nail-designs/dto/create-nail-design.dto.ts
import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class CreateNailDesignDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsString() process!: string;
  @IsString() @IsOptional() duration?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() style?: string;
  @IsUrl() @IsOptional() image_url?: string;
}
```

```typescript
// src/admin/nail-designs/dto/update-nail-design.dto.ts
import { IsString, IsOptional, IsNumber, IsUrl, Min } from 'class-validator';

export class UpdateNailDesignDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() process?: string;
  @IsString() @IsOptional() duration?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsString() @IsOptional() style?: string;
  @IsUrl() @IsOptional() image_url?: string;
}
```

- [ ] **Step 2: Create admin-nail-designs.service.ts**

```typescript
// src/admin/nail-designs/admin-nail-designs.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NailDesign } from '../../nail-designs/nail-designs.module';
import { CreateNailDesignDto } from './dto/create-nail-design.dto';
import { UpdateNailDesignDto } from './dto/update-nail-design.dto';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminNailDesignsService {
  constructor(
    @InjectRepository(NailDesign)
    private readonly repo: Repository<NailDesign>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { is_available: true };
    const [data, total] = await this.repo.findAndCount({
      where, skip, take: limit, order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateNailDesignDto): Promise<NailDesign> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateNailDesignDto): Promise<NailDesign> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async deactivate(id: number): Promise<NailDesign> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    if (!item.is_available) throw new BadRequestException('El diseño ya está desactivado');
    item.is_available = false;
    return this.repo.save(item);
  }

  async restore(id: number): Promise<NailDesign> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    if (item.is_available) throw new BadRequestException('El diseño ya está activo');
    item.is_available = true;
    return this.repo.save(item);
  }

  async remove(id: number): Promise<{ message: string }> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Diseño #${id} no encontrado`);
    if (item.is_available) {
      throw new BadRequestException('Desactiva el diseño antes de eliminarlo permanentemente');
    }
    await this.repo.delete(id);
    return { message: `Diseño #${id} eliminado permanentemente` };
  }
}
```

- [ ] **Step 3: Create admin-nail-designs.controller.ts**

```typescript
// src/admin/nail-designs/admin-nail-designs.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminNailDesignsService } from './admin-nail-designs.service';
import { CreateNailDesignDto } from './dto/create-nail-design.dto';
import { UpdateNailDesignDto } from './dto/update-nail-design.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/nail-designs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminNailDesignsController {
  constructor(private readonly service: AdminNailDesignsService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateNailDesignDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNailDesignDto) { return this.service.update(id, dto); }
  @Patch(':id/deactivate') deactivate(@Param('id', ParseIntPipe) id: number) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id', ParseIntPipe) id: number) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
```

- [ ] **Step 4: Update admin.module.ts with Hairstyles + NailDesigns**

```typescript
// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Hairstyle } from '../hairstyles/hairstyles.module';
import { NailDesign } from '../nail-designs/nail-designs.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';
import { AdminHairstylesController } from './hairstyles/admin-hairstyles.controller';
import { AdminHairstylesService } from './hairstyles/admin-hairstyles.service';
import { AdminNailDesignsController } from './nail-designs/admin-nail-designs.controller';
import { AdminNailDesignsService } from './nail-designs/admin-nail-designs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Hairstyle, NailDesign]),
  ],
  controllers: [
    AdminController,
    AdminProductsController,
    AdminHairstylesController,
    AdminNailDesignsController,
  ],
  providers: [
    AdminService,
    AdminProductsService,
    AdminHairstylesService,
    AdminNailDesignsService,
  ],
})
export class AdminModule {}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/admin/
git commit -m "feat: add Admin Hairstyles and Nail Designs CRUD with soft/hard delete"
```

---

## Chunk 5: Admin Services + Users CRUD

### Task 7: Admin Services CRUD

**Files:**
- Create: `src/admin/services/dto/create-service.dto.ts`
- Create: `src/admin/services/dto/update-service.dto.ts`
- Create: `src/admin/services/admin-services.service.ts`
- Create: `src/admin/services/admin-services.controller.ts`
- Modify: `src/admin/admin.module.ts`

- [ ] **Step 1: Create Service DTOs**

```typescript
// src/admin/services/dto/create-service.dto.ts
import { IsString, IsNumber, IsOptional, IsUrl, IsIn, Min } from 'class-validator';

const SERVICE_CATEGORIES = ['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure'] as const;

export class CreateServiceDto {
  @IsString() name!: string;
  @IsString() description!: string;
  @IsNumber() @Min(0) price!: number;
  @IsNumber() @Min(1) duration!: number;
  @IsIn(SERVICE_CATEGORIES) category!: string;
  @IsUrl() @IsOptional() imageUrl?: string;
}
```

```typescript
// src/admin/services/dto/update-service.dto.ts
import { IsString, IsNumber, IsOptional, IsUrl, IsIn, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) @IsOptional() price?: number;
  @IsNumber() @Min(1) @IsOptional() duration?: number;
  @IsIn(['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure']) @IsOptional() category?: string;
  @IsUrl() @IsOptional() imageUrl?: string;
}
```

- [ ] **Step 2: Create admin-services.service.ts**

```typescript
// src/admin/services/admin-services.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { isActive: true };
    const [data, total] = await this.repo.findAndCount({
      where, skip, take: limit, order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async deactivate(id: string): Promise<Service> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    if (!item.isActive) throw new BadRequestException('El servicio ya está desactivado');
    item.isActive = false;
    return this.repo.save(item);
  }

  async restore(id: string): Promise<Service> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    if (item.isActive) throw new BadRequestException('El servicio ya está activo');
    item.isActive = true;
    return this.repo.save(item);
  }

  async remove(id: string): Promise<{ message: string }> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Servicio #${id} no encontrado`);
    if (item.isActive) {
      throw new BadRequestException('Desactiva el servicio antes de eliminarlo permanentemente');
    }
    await this.repo.delete(id);
    return { message: `Servicio eliminado permanentemente` };
  }
}
```

- [ ] **Step 3: Create admin-services.controller.ts**

```typescript
// src/admin/services/admin-services.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminServicesService } from './admin-services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AdminListDto } from '../dto/admin-list.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminServicesController {
  constructor(private readonly service: AdminServicesService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Post() @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateServiceDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateServiceDto) { return this.service.update(id, dto); }
  @Patch(':id/deactivate') deactivate(@Param('id') id: string) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id') id: string) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id') id: string) { return this.service.remove(id); }
}
```

> Note: Services use UUID string IDs — no `ParseIntPipe`.

---

### Task 8: Admin Users CRUD

**Files:**
- Create: `src/admin/users/admin-users.service.ts`
- Create: `src/admin/users/admin-users.controller.ts`
- Modify: `src/admin/admin.module.ts` (final version)

- [ ] **Step 1: Create admin-users.service.ts**

```typescript
// src/admin/users/admin-users.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AdminListDto } from '../dto/admin-list.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(dto: AdminListDto) {
    const { page = 1, limit = 20, showInactive = false } = dto;
    const skip = (page - 1) * limit;
    const where = showInactive ? {} : { isActive: true };
    const [rawData, total] = await this.repo.findAndCount({
      where, skip, take: limit, order: { createdAt: 'DESC' },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });
    return { data: rawData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateRole(id: number, role: string): Promise<Omit<User, 'password'>> {
    if (!['user', 'admin'].includes(role)) {
      throw new BadRequestException('Rol inválido. Valores permitidos: user, admin');
    }
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    user.role = role;
    const saved = await this.repo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async deactivate(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    if (!user.isActive) throw new BadRequestException('El usuario ya está desactivado');
    if (user.role === 'admin') {
      const adminCount = await this.repo.count({ where: { role: 'admin', isActive: true } });
      if (adminCount <= 1) throw new BadRequestException('No puedes desactivar el único administrador activo');
    }
    user.isActive = false;
    await this.repo.save(user);
    return { message: `Usuario #${id} desactivado` };
  }

  async restore(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    if (user.isActive) throw new BadRequestException('El usuario ya está activo');
    user.isActive = true;
    await this.repo.save(user);
    return { message: `Usuario #${id} restaurado` };
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario #${id} no encontrado`);
    if (user.isActive) {
      throw new BadRequestException('Desactiva el usuario antes de eliminarlo permanentemente');
    }
    if (user.role === 'admin') {
      throw new BadRequestException('No se puede eliminar permanentemente a un administrador');
    }
    await this.repo.delete(id);
    return { message: `Usuario #${id} eliminado permanentemente` };
  }
}
```

- [ ] **Step 2: Create admin-users.controller.ts**

```typescript
// src/admin/users/admin-users.controller.ts
import {
  Controller, Get, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminListDto } from '../dto/admin-list.dto';
import { UpdateRoleDto } from '../../auth/dto/auth.dto';
import { JwtAuthGuard } from '../../auth/auth.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get() findAll(@Query() dto: AdminListDto) { return this.service.findAll(dto); }
  @Patch(':id/role') updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) { return this.service.updateRole(id, dto.role); }
  @Patch(':id/deactivate') deactivate(@Param('id', ParseIntPipe) id: number) { return this.service.deactivate(id); }
  @Patch(':id/restore') restore(@Param('id', ParseIntPipe) id: number) { return this.service.restore(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
```

- [ ] **Step 3: Final admin.module.ts with all entities**

```typescript
// src/admin/admin.module.ts
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
```

- [ ] **Step 4: Verify final compilation**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: zero errors in admin/ files.

- [ ] **Step 5: Final backend verification**

```bash
# List users (admin only)
curl -s -b cookies.txt "http://localhost:3000/api/admin/users" | python -m json.tool

# List services (admin, all including inactive)
curl -s -b cookies.txt "http://localhost:3000/api/admin/services?showInactive=true" | python -m json.tool

# Verify unauthorized access blocked
curl -s "http://localhost:3000/api/admin/users" | python -m json.tool
```

Expected unauthorized: `{ "statusCode": 401, "message": "Unauthorized" }`

- [ ] **Step 6: Final commit**

```bash
git add src/admin/ src/services/
git commit -m "feat: complete Admin CRUD for Services and Users with soft/hard delete safety guards"
```

---

## Verification Final

- [ ] All `/api/admin/*` endpoints return 401 without cookie
- [ ] Login as admin, all endpoints return data
- [ ] Deactivate → record `is_active/is_available/isActive = false`
- [ ] Restore → record back to active
- [ ] Hard delete without soft delete first → 400 Bad Request
- [ ] Hard delete after soft delete → 200 OK, record gone
- [ ] Cannot deactivate last active admin → 400 Bad Request
- [ ] Cannot hard delete admin user → 400 Bad Request
