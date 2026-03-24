import { Module, Injectable, Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';

// ─── ENTIDAD ────────────────────────────────────────────────────────────────

@Entity('nail_designs')
export class NailDesign {
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
    style?: string;

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
export class NailDesignsService {
    constructor(
        @InjectRepository(NailDesign)
        private readonly repo: Repository<NailDesign>,
    ) { }

    findAll(style?: string) {
        const where: any = { is_available: true };
        if (style) where.style = style;
        return this.repo.find({ where, order: { name: 'ASC' } });
    }

    async findOne(id: number) {
        const design = await this.repo.findOne({ where: { id } });
        if (!design) throw new NotFoundException(`Diseño #${id} no encontrado`);
        return design;
    }
}

// ─── CONTROLADOR ─────────────────────────────────────────────────────────────

@Controller('nail-designs')
export class NailDesignsController {
    constructor(private readonly service: NailDesignsService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }
}

// ─── MÓDULO ──────────────────────────────────────────────────────────────────

@Module({
    imports: [TypeOrmModule.forFeature([NailDesign])],
    controllers: [NailDesignsController],
    providers: [NailDesignsService],
    exports: [NailDesignsService],
})
export class NailDesignsModule { }
