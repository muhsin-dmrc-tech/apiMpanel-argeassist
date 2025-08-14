import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn
} from 'typeorm';

@Entity('Odemeler')
export class Odemeler {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  OdemeID: number;

  @Column({ type: 'bigint', nullable: false })
  KullaniciID: number;

  @Column({ type: 'bigint', nullable: false })
  SiparisID: number;

  @Column({ nullable: false, type: 'datetime' })
  OdemeTarihi: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  Tutar: number;

  @Column({ nullable: false, type: 'varchar', length: '50' })/* Bildirimin durumu Kredi Kartı - Banka Havalesi - Paypal vb. */
  OdemeYontemi: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;
}
