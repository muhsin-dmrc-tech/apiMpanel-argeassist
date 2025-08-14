import { BordroKayitlari } from 'src/bordro-kayitlari/entities/bordro-kayitlari.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { IzinTalepleri } from 'src/izin-talepleri/entities/izin-talepleri.entity';
import { KullaniciGruplari } from 'src/kullanici-gruplari/entities/kullanici-gruplari.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { PDKS } from 'src/pdks/entities/pdks.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';

@Entity('Personel')
export class Personel {
  @PrimaryGeneratedColumn({ type: 'int' })
  PersonelID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  AdSoyad: string;

  @Column({ type: 'varchar', length: '11', nullable: true })
  TCNo: string;

  @Column({ type: 'int', nullable: false })
  IliskiID: number;

  @Column({ type: 'int', nullable: true })
  KullaniciID: number;

  @Column({ type: 'int', nullable: true })
  GrupID: number;

  @Column({ nullable: true, type: 'varchar', length: '100' })
  Rol: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  Tip: number;//3 teknokent 1 Firma

  @Column({ nullable: true, type: 'bit', default: 0 })
  BilisimPersoneli: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  SirketOrtagi: boolean;

  @Column({ nullable: true, type: 'time', precision: 7 })
  MesaiBaslangic: string;

  @Column({ nullable: true, type: 'time', precision: 7 })
  MesaiBitis: string;

  @Column({ nullable: true, type: 'date' })
  IseGirisTarihi: Date;

  @Column({ nullable: true, type: 'date' })
  IstenCikisTarihi: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  NetMaas: number;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @ManyToOne(() => Kullanicilar, kullanici => kullanici.id, { nullable: true })
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

  @ManyToOne(() => KullaniciGruplari, grup => grup.GrupID, { nullable: true })
  @JoinColumn({ name: 'GrupID' })
  Grup: KullaniciGruplari;

  @OneToMany(() => PDKS, pdks => pdks.Personel)
  PdksKayitlari: PDKS[];

  @OneToMany(() => BordroKayitlari, bordro => bordro.Personel)
  BordroKayitlari: BordroKayitlari[];

  @OneToMany(() => IzinTalepleri, izin => izin.Personel)
  IzinTalepleri: IzinTalepleri[];


  // Teknik olarak sadece TS desteği için tanımlanıyor
  @ManyToOne(() => Firma, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'IliskiID' })
  Firma?: Firma;

  @ManyToOne(() => Teknokentler, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'IliskiID' })
  Teknokent?: Teknokentler;

}
