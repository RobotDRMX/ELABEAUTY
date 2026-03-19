import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column()
  duration!: number; // en minutos

  @Column({
    type: 'enum',
    enum: ['facial', 'corporal', 'spa', 'masajes', 'manicure', 'pedicure'],
    default: 'facial',
  })
  category!: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
