import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { FirmaBilgileri } from './firma-bilgileri.entity';

@Entity('FirmaBilgileriSubeler')
export class FirmaBilgileriSubeler {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  SubeID: number;

  @Column({ nullable: false, type: 'bigint' })
  BilgiID: number;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Email: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Telefon: string;

  @Column({ nullable: true, type: 'varchar', length: '400' })
  Adres: string;

  @Column({ nullable: false, type: 'varchar', length: '100' })
  Il: string;

  @Column({ nullable: false, type: 'varchar', length: '100' })
  Ilce: string;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Ulke: string;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  SubeAdi: string;

  @Column({ nullable: true, type: 'bit' })
  AnaSubemi: boolean;

  @ManyToOne(() => FirmaBilgileri, firmaBilgileri => firmaBilgileri.Subeler)
  @JoinColumn({ name: 'BilgiID' })
  FirmaBilgisi: FirmaBilgileri;

}