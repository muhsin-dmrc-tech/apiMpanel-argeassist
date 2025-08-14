import { Firma } from 'src/firmalar/entities/firma.entity';
import { KullaniciGruplari } from 'src/kullanici-gruplari/entities/kullanici-gruplari.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('KullaniciDavetleri')
export class KullaniciDavetleri {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  IliskiID: number;

  @Column({ type: 'int', nullable: true })
  PersonelID: number;

  @Column({ type: 'int', nullable: false })
  DavetciKullaniciID: number;

  @Column({ nullable: false, type: 'varchar', length: 255 })
  Email: string;

  @Column({ type: 'int', nullable: false })
  GrupID: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  Durum: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  Tip: number;//3 teknokent 1 Firma

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.id)
  @JoinColumn({ name: 'DavetciKullaniciID' })
  DavetciKullanici: Kullanicilar;

  @ManyToOne(() => KullaniciGruplari, gruplar => gruplar.GrupID, { nullable: true })
  @JoinColumn({ name: 'GrupID' })
  Grup: KullaniciGruplari;

  // Teknik olarak sadece TS desteği için tanımlanıyor
  @ManyToOne(() => Firma, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'IliskiID' })
  Firma?: Firma;

  @ManyToOne(() => Teknokentler, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'IliskiID' })
  Teknokent?: Teknokentler;

}
