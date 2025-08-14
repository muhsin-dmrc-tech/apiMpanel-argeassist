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
  JoinColumn,
  OneToMany
} from 'typeorm';
import { GorevKullanicilari } from './gorev-kullanicilari.entity';

@Entity('GorevListesi')
export class GorevListesi {
  @PrimaryGeneratedColumn({ type: 'int' })
  GorevID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: true })
  TamamlayanKullaniciID: number;

  @Column({ type: 'int', nullable: true })
  ProjeID: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  BolumAnahtar: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  Tamamlandimi: boolean;

  @Column({ nullable: false, type: 'datetime' })
  SonTeslimTarihi: Date;

  @Column({ nullable: true, type: 'datetime', default: null })
  TamamlanmaTarihi: Date;

  @CreateDateColumn({ nullable: false, type: 'datetime' })
  OlusturmaTarihi: Date;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Projeler, proje => proje.ProjeID, {nullable:true})
  @JoinColumn({ name: 'ProjeID' })
  Proje: Projeler;

  @ManyToOne(() => Kullanicilar, kullanici => kullanici.id, { nullable: true })
  @JoinColumn({ name: 'TamamlayanKullaniciID' })
  TamamlayanKullanici: Kullanicilar;

  @OneToMany(() => GorevKullanicilari, kullanicilar => kullanicilar.Gorev)
  Kullanicilar: GorevKullanicilari[];

}
