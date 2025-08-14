import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import { Donem } from 'src/donem/entities/donem.entity';
import { Surecler } from 'src/surecler/entities/surecler.entity';
import { SurecKayitlari } from 'src/surecler/entities/surec-kayitlari.entity';

@Entity('ProjeRaporlari')
export class ProjeRaporlari {
  @PrimaryGeneratedColumn({ type: 'int' })
  RaporID: number;

  @Column({ type: 'int', nullable: false })
  ProjeID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  GunDetayliRapor: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  SGKHizmet: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  OnayliSGKHizmet: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  MuhtasarVePrim: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  OnayliMuhtasarVePrim: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  MuafiyetRaporu: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  SGKTahakkuk: string;

  @Column({ type: 'int', nullable: false })
  TeknokentID: number;

  @Column({ type: 'int', nullable: true })
  HazirlayanKullaniciID: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  Durum: string;

  @Column({ type: 'bit', nullable: true, default: 0 })
  OnOnay: boolean;

  @Column({ type: 'bit', nullable: true, default: 0 })
  HakemOnay: boolean;

  @Column({ nullable: false, type: 'int', default: 1 })
  SurecSirasi: number;

  @Column({ type: 'varchar', length: 4000, nullable: true })
  Hatalar: string;

  @Column({ type: 'varchar', length: 4000, nullable: true })
  Tamamlananlar: string;

  @CreateDateColumn({ nullable: false, type: 'datetime' })
  OlusturmaTarihi: Date;

  @UpdateDateColumn({ nullable: true, type: 'datetime' })
  SonDuzenlenmeTarihi: Date;

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.id, { nullable: true })
  @JoinColumn({ name: 'HazirlayanKullaniciID' })
  HazirlayanKullanici: Kullanicilar;

  @ManyToOne(() => Projeler, proje => proje.ProjeID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProjeID' })
  Proje: Projeler;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;


  SurecKayitlari?: SurecKayitlari[];
}
