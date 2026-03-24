import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
@Unique(['cart', 'product'])
export class CartItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
    cart!: Cart;

    @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
    product!: Product;

    @Column({ default: 1 })
    quantity!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
