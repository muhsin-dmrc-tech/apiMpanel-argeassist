import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Donem } from 'src/donem/entities/donem.entity';
import { SurecKayitlari } from 'src/surecler/entities/surec-kayitlari.entity';
import { MpKullanicilar } from 'src/mp-kullanicilar/entities/mp-kullanicilar.entity';

@Entity('MpDokumanlar')
export class MpDokumanlar {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  ID: number;

  @Column({ type: 'bigint', nullable: false })
  KullaniciID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  SGKHizmet: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  OnayliSGKHizmet: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  MuhtasarVePrim: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  OnayliMuhtasarVePrim: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  SGKTahakkuk: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  Durum: string;

  @Column({ type: 'bit', nullable: true, default: 0 })
  Onaylimi: boolean;

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

  @ManyToOne(() => MpKullanicilar, kullanicilar => kullanicilar.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: MpKullanicilar;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  SurecKayitlari?: SurecKayitlari[];
}
