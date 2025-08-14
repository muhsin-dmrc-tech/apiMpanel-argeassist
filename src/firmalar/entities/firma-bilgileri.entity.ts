import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { FirmaBilgileriSubeler } from './firma-bilgileri-subeler.entity';

@Entity('FirmaBilgileri')
export class FirmaBilgileri {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  BilgiID: number;

  @Column({ nullable: false, type: 'bigint' })
  IliskiID: number;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  WebSitesi: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Linkedin: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Logo: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Sektor: string;

  @Column({ nullable: true, type: 'date' })
  KurulusYili: string;

  @Column({ nullable: true, type: 'int' })
  CalisanSayisi: number;

  @Column({ nullable: false, type: 'varchar', length: '400' })
  KisaTanitim: string;

  @Column({ nullable: false, type: 'nvarchar', length: '4000' })
  FirmaAciklamasi: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  TemsilciAdi: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  TemsilciUnvani: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  TemsilciEmail: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  TemsilciTelefon: string;
  
  @Column({ type: 'int', nullable: false,default:1 })
  Tip: number;//3 teknokent 1 Firma

  @OneToMany(() => FirmaBilgileriSubeler, sube => sube.FirmaBilgisi,{nullable: true})
  Subeler: FirmaBilgileriSubeler[];
}