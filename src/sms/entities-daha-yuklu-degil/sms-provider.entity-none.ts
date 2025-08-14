import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('SmsProvider')
export class SmsProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  apiUrl: string;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: true })
  status: boolean;
}
