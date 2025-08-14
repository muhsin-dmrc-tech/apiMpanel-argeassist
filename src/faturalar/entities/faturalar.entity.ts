import { FaturaBilgileri } from 'src/fatura-bilgileri/entities/fatura-bilgileri.entity';
import { FirmaAbonelikleri } from 'src/firma-abonelikleri/entities/firma-abonelikleri.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('Faturalar')
export class Faturalar {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  FaturaID: number;

  @Column({ type: 'bigint', nullable: false })
  AbonelikID: number;

  @Column({ type: 'bigint', nullable: false })
  KullaniciID: number;

  @Column({ type: 'bigint', nullable: false })
  FirmaID: number;

  @Column({ type: 'bigint', nullable: false })
  FaturaBilgiID: number;

  @Column({ nullable: false, type: 'datetime' })
  FaturaTarihi: Date;

  @Column({ nullable: true, type: 'datetime' })
  SonOdemeTarihi: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  Tutar: number;

  @Column({ nullable: false, type: 'varchar', length: '50' })/* Bildirimin durumu Ödendi - Bekleniyor - Gecikmiş */
  Durum: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;

  @ManyToOne(() => Firma, firma => firma.FirmaID)
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => FirmaAbonelikleri, abonelik => abonelik.AbonelikID)
  @JoinColumn({ name: 'AbonelikID' })
  Abonelik: FirmaAbonelikleri;

  @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

  @ManyToOne(() => FaturaBilgileri, fatura => fatura.FaturaBilgiID)
  @JoinColumn({ name: 'FaturaBilgiID' })
  FaturaBilgi: FaturaBilgileri;
}
