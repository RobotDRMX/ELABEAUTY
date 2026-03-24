import { Module, Injectable, Controller, Post, Get, Delete, Body, UseGuards, Req, Param } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/auth.module';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectRepository(Favorite)
        private favoritesRepository: Repository<Favorite>,
    ) { }

    async findAll(userId: number) {
        return this.favoritesRepository.find({
            where: { user: { id: userId } },
            relations: ['product']
        });
    }

    async add(userId: number, productId: number) {
        const existing = await this.favoritesRepository.findOne({
            where: { user: { id: userId }, product: { id: productId } }
        });
        if (existing) return existing;

        const favorite = this.favoritesRepository.create({
            user: { id: userId },
            product: { id: productId }
        });
        return this.favoritesRepository.save(favorite);
    }

    async remove(userId: number, productId: number) {
        return this.favoritesRepository.delete({
            user: { id: userId },
            product: { id: productId }
        });
    }
}

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Get()
    getFavorites(@Req() req: any) {
        return this.favoritesService.findAll(req.user.userId);
    }

    @Post(':productId')
    addFavorite(@Req() req: any, @Param('productId') productId: number) {
        return this.favoritesService.add(req.user.userId, productId);
    }

    @Delete(':productId')
    removeFavorite(@Req() req: any, @Param('productId') productId: number) {
        return this.favoritesService.remove(req.user.userId, productId);
    }
}

@Module({
    imports: [TypeOrmModule.forFeature([Favorite])],
    controllers: [FavoritesController],
    providers: [FavoritesService],
    exports: [FavoritesService]
})
export class FavoritesModule { }
