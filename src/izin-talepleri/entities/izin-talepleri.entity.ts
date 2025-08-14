import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { IzinSureleri } from 'src/izin-sureleri/entities/izin-sureleri.entity';
import { IzinTuru } from 'src/izin-turu/entities/izin-turu.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';

@Entity('IzinTalepleri')
export class IzinTalepleri {
  @PrimaryGeneratedColumn({ type: 'int' })
  IzinTalepID: number;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ type: 'int', nullable: false })
  IzinTuruID: number;

  @Column({ type: 'int', nullable: false })
  PersonelID: number;

  @Column({ nullable: true, type: 'text' })
  Notlar: string;

  @Column({ type: 'bigint', nullable: false, default:0 })
  ToplamGun: number;

  @Column({ nullable: true, type: 'varchar', length:255 })
  EkDosya: string;

  @Column({ nullable: true, type: 'text' })
  YoneticiMesaji: string;

  @Column({ nullable: true, type: 'bit', default: 1 })
  HaftaIciGunuDahil: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  CumartesiDahil: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  PazarDahil: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Donem, donem => donem.DonemID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => IzinTuru, izintur => izintur.IzinTuruID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'IzinTuruID' })
  IzinTuru: IzinTuru;

  @ManyToOne(() => Personel, personel => personel.PersonelID)
  @JoinColumn({ name: 'PersonelID' })
  Personel: Personel;

  @OneToMany(() => IzinSureleri, izinSureleri => izinSureleri.IzinTalep)
  IzinSureleri: IzinSureleri[];

}
