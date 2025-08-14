import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('ResmiTatiller')
export class ResmiTatiller {
  @PrimaryGeneratedColumn({ type: 'int' })
  ResmiTatilID: number;

  @Column({ nullable: false, type: 'varchar', length: '250' })
  ResmiTatil: string;

  @Column({ type: 'date', nullable:false })
  Tarih: Date;
}
