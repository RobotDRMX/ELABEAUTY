import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true })
  product_id?: number;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ nullable: true })
  cta_label?: string;

  @Column({ nullable: true })
  cta_link?: string;

  @Column({ nullable: true })
  badge?: string;

  @Column({ nullable: true })
  tag?: string;

  @Column({ type: 'timestamptz' })
  start_date!: Date;

  @Column({ type: 'timestamptz' })
  end_date!: Date;

  @Column({ default: 0 })
  sort_order!: number;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
