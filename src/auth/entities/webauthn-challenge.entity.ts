import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webauthn_challenges')
export class WebAuthnChallenge {
  @PrimaryGeneratedColumn()
  id!: number;

  // NULL for discoverable credentials flow
  @Column({ nullable: true })
  userId!: number | null;

  @Column()
  challenge!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;
}
