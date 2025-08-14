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

@Entity('GrupYetkileri')
export class GrupYetkileri {
  @PrimaryGeneratedColumn({ type: 'int' })
  YetkiID: number;

  @Column({ type: 'int', nullable:false })
  IliskiID: number;

  @Column({ type: 'int', nullable:false })
  GrupID: number;

  @Column({ type: 'int', nullable: false,default:1 })
  Tip: number;//3 teknokent 1 Firma

  @Column({ type: 'varchar', length: 50, nullable:false}) 
  Yetki: string;

  @ManyToOne(() => KullaniciGruplari, gruplar => gruplar.GrupID)
  @JoinColumn({ name: 'GrupID' })
  Grup: KullaniciGruplari;

}
