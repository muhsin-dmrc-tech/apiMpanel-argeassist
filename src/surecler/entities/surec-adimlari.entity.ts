import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Surecler } from './surecler.entity';
import { SurecAdimBaglantilari } from './surec-adim-baglantilari.entity';

@Entity('SurecAdimlari')
export class SurecAdimlari {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  ID: number;

  @Column({ type: 'bigint', nullable: false })
  SurecID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  AdimAdi: string;

  @Column({ type: 'int', nullable: false })
  SiraNo: number;

  @ManyToOne(() => Surecler, surec => surec.Adimlar)
  @JoinColumn({ name: 'SurecID' })
  Surec: Surecler;

  @OneToMany(() => SurecAdimBaglantilari, adimb => adimb.KaynakAdim)
  HedefAdimBaglantilari: SurecAdimBaglantilari[];

  @OneToMany(() => SurecAdimBaglantilari, adimb => adimb.HedefAdim)
  KaynakAdimBaglantilari: SurecAdimBaglantilari[];

}
