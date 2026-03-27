import { Module, Injectable, Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';

// ─── ENTIDAD ────────────────────────────────────────────────────────────────

@Entity('peinados')
export class Hairstyle {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 200 })
    name!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'text' })
    process!: string;

    @Column({ nullable: true })
    duration?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price?: number;

    @Column({ nullable: true })
    category?: string;

    @Column({ nullable: true })
    image_url?: string;

    @Column({ default: true })
    is_available!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ─── SERVICIO ────────────────────────────────────────────────────────────────

@Injectable()
export class HairstylesService {
    constructor(
        @InjectRepository(Hairstyle)
        private readonly repo: Repository<Hairstyle>,
    ) { }

    findAll(category?: string) {
        const where: any = { is_available: true };
        if (category) where.category = category;
        return this.repo.find({ where, order: { name: 'ASC' } });
    }

    async findOne(id: number) {
        const hairstyle = await this.repo.findOne({ where: { id } });
        if (!hairstyle) throw new NotFoundException(`Peinado #${id} no encontrado`);
        return hairstyle;
    }
}

// ─── CONTROLADOR ─────────────────────────────────────────────────────────────

@ApiTags('Peinados')
@Controller('hairstyles')
export class HairstylesController {
    constructor(private readonly service: HairstylesService) { }

    @ApiOperation({ summary: 'Listar todos los peinados disponibles' })
    @Get()
    findAll() {
        return this.service.findAll();
    }

    @ApiOperation({ summary: 'Obtener detalle de un peinado' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }
}

// ─── MÓDULO ──────────────────────────────────────────────────────────────────

@Module({
    imports: [TypeOrmModule.forFeature([Hairstyle])],
    controllers: [HairstylesController],
    providers: [HairstylesService],
    exports: [HairstylesService],
})
export class HairstylesModule { }
