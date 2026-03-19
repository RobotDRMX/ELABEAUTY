import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ default: 'user' })
    role!: string;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ type: 'text', nullable: true })
    webauthnCredential!: string | null;

    @Column({ type: 'text', nullable: true })
    faceDescriptor!: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
