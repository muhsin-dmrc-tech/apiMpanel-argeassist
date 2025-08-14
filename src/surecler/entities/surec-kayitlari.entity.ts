import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Surecler } from './surecler.entity';
import { SurecAdimlari } from './surec-adimlari.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';

@Entity('SurecKayitlari')
export class SurecKayitlari {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  ID: number;

  @Column({ type: 'bigint', nullable: false })
  SurecID: number;

  @Column({ type: 'bigint', nullable: false })
  AdimID: number;

  @Column({ type: 'bigint', nullable: false })//Takip ettiği bağlantılı tablo öğesinin id si
  ItemID: number;

  @Column({ type: 'bigint', nullable: false })
  KullaniciID: number;

  @Column({ nullable: false, type: 'varchar', length: '100' })
  Durum: string;

  @CreateDateColumn({ nullable: false, type: 'datetime' })
  BaslamaZamani: Date;

  @Column({ nullable: true, type: 'datetime' })
  BitirmeZamani: Date;

  @Column({ nullable: true, type: 'nvarchar', length: '4000' })
  Aciklama: string;

  @ManyToOne(() => Surecler, surec => surec.ID)
  @JoinColumn({ name: 'SurecID' })
  Surec: Surecler;

  @ManyToOne(() => SurecAdimlari, adim => adim.ID)
  @JoinColumn({ name: 'AdimID' })
  Adim: SurecAdimlari;

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.id)
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

}
