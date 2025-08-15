import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
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

  
}
