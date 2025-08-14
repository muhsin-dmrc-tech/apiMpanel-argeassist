import { Firma } from 'src/firmalar/entities/firma.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('FaturaBilgileri')
export class FaturaBilgileri {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  FaturaBilgiID: number;

  @Column({ type: 'bigint', nullable: false })
  FirmaID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  FirmaAdi: string;

  @Column({ nullable: false, type: 'varchar', length: '50' })
  VergiNo: string;

  @Column({ nullable: false, type: 'varchar', length: '100' })
  VergiDairesi: string;

  @Column({ nullable: false, type: 'text' })
  Adres: string;

  @Column({ nullable: false, type: 'varchar', length: '100' })
  Sehir: string;

  @Column({ nullable: false, type: 'varchar', length: '100' })
  Ilce: string;

  @Column({ nullable: false, type: 'varchar', length: '100' })
  Telefon: string;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Eposta: string;

  @Column({ nullable: true, type: 'bit', default: 1 })
  VarsayilanMi: boolean;

  @CreateDateColumn({ nullable: false, type: 'datetime' })
  OlusturmaTarihi: Date;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;

  @ManyToOne(() => Firma, firma => firma.FirmaID)
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;
}
