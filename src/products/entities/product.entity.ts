import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  category: string;

  @Column()
  subcategory: string;

  @Column({ default: 0 })
  stock: number;

  @Column()
  image_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  review_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Métodos
  hasStock(): boolean {
    return this.stock > 0;
  }

  getFormattedPrice(): string {
    return `$${this.price.toFixed(2)} MXN`;
  }
}