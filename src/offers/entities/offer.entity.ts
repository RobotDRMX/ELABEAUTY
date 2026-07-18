import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column()
  image_url!: string;

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
