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
