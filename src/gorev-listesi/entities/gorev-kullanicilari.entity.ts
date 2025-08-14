import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { GorevListesi } from './gorev.listesi.entity';

@Entity('GorevKullanicilari')
export class GorevKullanicilari {
  @PrimaryGeneratedColumn({ type: 'int' })
  GorevKullaniciID: number;

  @Column({ type: 'int', nullable: true })
  KullaniciID: number;

  @Column({ type: 'int', nullable: true })
  GorevID: number;

  @CreateDateColumn({ nullable: false, type: 'datetime' })
  OlusturmaTarihi: Date;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date; 

  @ManyToOne(() => Kullanicilar, kullanici => kullanici.id, { nullable: true })
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

  @ManyToOne(() => GorevListesi, gorev => gorev.GorevID, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'GorevID' })
  Gorev: GorevListesi;

}
