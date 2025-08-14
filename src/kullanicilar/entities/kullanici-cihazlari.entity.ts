import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Kullanicilar } from './kullanicilar.entity';



@Index(['KullaniciID', 'Platform'], { unique: true })
@Entity('KullaniciCihazlari')
export class KullaniciCihazlari {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ nullable: false, type: 'bigint' })
  KullaniciID: number;

  @Column({ nullable: false, type: 'varchar', length: 400 })
  Token: string;

  @Column({ nullable: false, type: 'varchar', length: 20 })
  Platform: string;

  @Column({ nullable: true, type: 'datetime', default: null })
  SonGuncellemeTarihi: Date;

  @Column({ type: "bit", default: 0, nullable: false })
  isActive: boolean;

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.Cihazlar)
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;
}
