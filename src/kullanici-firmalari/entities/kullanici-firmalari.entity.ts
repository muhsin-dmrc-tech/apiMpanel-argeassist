import { Firma } from 'src/firmalar/entities/firma.entity';
import { KullaniciGruplari } from 'src/kullanici-gruplari/entities/kullanici-gruplari.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('KullaniciFirmalari')
export class KullaniciFirmalari {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  KullaniciID: number;

  @Column({ type: 'int', nullable: true })
  GrupID: number;

  @Column({ type: 'varchar', length: 100, nullable: false, default: "admin" })
  Rol: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @ManyToOne(() => Firma, firma => firma.Kullanicilar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

  @ManyToOne(() => KullaniciGruplari, gruplar => gruplar.GrupID,{nullable: true})
  @JoinColumn({ name: 'GrupID' })
  Gurup: KullaniciGruplari;
}
