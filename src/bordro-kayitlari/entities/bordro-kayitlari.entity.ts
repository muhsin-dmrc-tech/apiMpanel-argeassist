import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm';

@Entity('BordroKayitlari')
export class BordroKayitlari {
  @PrimaryGeneratedColumn({ type: 'int' })
  BordroKayitID: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  NetOdenen: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  ExstraOdenen: number;

  @Column({ type: 'int', nullable: false })
  CalisilanGunSayisi: number;

  @Column({ type: 'int', nullable: false,default:0 })
  IzinliGunSayisi: number;

  @Column({ type: 'int', nullable: false,default:0 })
  ArgeGunSayisi: number;

  @Column({ nullable: true, type: 'bit', default:0 })
  VergiIstisnasiUygula: boolean;

  @Column({ nullable: true, type: 'bit', default:0 })
  BesPuanlikIndirimUygula: boolean;

  @Column({ nullable: true, type: 'varchar', length: '400' })
  Not: string;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  PersonelID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @CreateDateColumn({ nullable: true, type: 'datetime' })
  KayitTarihi: Date;

  @UpdateDateColumn({ nullable: true, type: 'datetime' })
  GuncellemeTarihi: Date;

  @DeleteDateColumn({ nullable: true, type: 'datetime' })
  SilinmeTarihi: Date;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => Personel, personel => personel.PersonelID)
  @JoinColumn({ name: 'PersonelID' })
  Personel: Personel;
}
