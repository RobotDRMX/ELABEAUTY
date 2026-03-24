import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('favorites')
@Unique(['user', 'product'])
export class Favorite {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    user!: User;

    @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
    product!: Product;

    @CreateDateColumn()
    createdAt!: Date;
}
