import { Module, Injectable, Controller, Post, Get, Delete, Body, UseGuards, Req, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/auth.module';
import { AddToCartDto, UpdateCartQuantityDto } from './dto/cart.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
    ) { }

    async findOrCreateCart(userId: number) {
        let cart = await this.cartRepository.findOne({
            where: { user: { id: userId } },
            relations: ['items', 'items.product']
        });

        if (!cart) {
            cart = this.cartRepository.create({ user: { id: userId } });
            await this.cartRepository.save(cart);
            cart.items = [];
        }
        return cart;
    }

    async addItem(userId: number, productId: number, quantity: number = 1) {
        const cart = await this.findOrCreateCart(userId);
        let item = await this.cartItemRepository.findOne({
            where: { cart: { id: cart.id }, product: { id: productId } }
        });

        if (item) {
            item.quantity += quantity;
        } else {
            item = this.cartItemRepository.create({
                cart: { id: cart.id },
                product: { id: productId },
                quantity
            });
        }
        return this.cartItemRepository.save(item);
    }

    async updateQuantity(userId: number, productId: number, quantity: number) {
        const cart = await this.findOrCreateCart(userId);
        if (quantity <= 0) {
            return this.removeItem(userId, productId);
        }
        return this.cartItemRepository.update(
            { cart: { id: cart.id }, product: { id: productId } },
            { quantity }
        );
    }

    async removeItem(userId: number, productId: number) {
        const cart = await this.findOrCreateCart(userId);
        return this.cartItemRepository.delete({
            cart: { id: cart.id },
            product: { id: productId }
        });
    }

    async clearCart(userId: number) {
        const cart = await this.findOrCreateCart(userId);
        return this.cartItemRepository.delete({ cart: { id: cart.id } });
    }
}

@ApiTags('Carrito')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @ApiOperation({ summary: 'Obtener carrito del usuario' })
    @Get()
    getCart(@Req() req: any) {
        return this.cartService.findOrCreateCart(req.user.userId);
    }

    @ApiOperation({ summary: 'Agregar producto al carrito' })
    @Post('items')
    addItem(@Req() req: any, @Body() dto: AddToCartDto) {
        return this.cartService.addItem(req.user.userId, dto.productId, dto.quantity || 1);
    }

    @ApiOperation({ summary: 'Actualizar cantidad de producto en carrito' })
    @Patch('items/:productId')
    updateQuantity(
        @Req() req: any,
        @Param('productId', ParseIntPipe) productId: number,
        @Body() dto: UpdateCartQuantityDto,
    ) {
        return this.cartService.updateQuantity(req.user.userId, productId, dto.quantity);
    }

    @ApiOperation({ summary: 'Eliminar producto del carrito' })
    @Delete('items/:productId')
    removeItem(@Req() req: any, @Param('productId', ParseIntPipe) productId: number) {
        return this.cartService.removeItem(req.user.userId, productId);
    }

    @ApiOperation({ summary: 'Vaciar carrito completo' })
    @Delete()
    clearCart(@Req() req: any) {
        return this.cartService.clearCart(req.user.userId);
    }
}

@Module({
    imports: [TypeOrmModule.forFeature([Cart, CartItem])],
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService]
})
export class CartModule { }
