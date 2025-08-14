import { Bildirimler } from 'src/bildirimler/entities/bildirimler.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('KullaniciBildirimleri')
export class KullaniciBildirimleri {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  KullaniciBildirimID: number;

  @Column({ type: 'bigint', nullable: false })
  KullaniciID: number;

  @Column({ type: 'bigint', nullable: false })
  BildirimID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Baslik: string;

  @Column({ nullable: false, type: 'text' })
  Icerik: string;

  @Column({ nullable: true, type: 'datetime' })
  PlanlananTarih: Date;

  @Column({ nullable: false, type: 'varchar', length: '50' })/* Bildirimin durumu Beklemede - İşleniyor - Gönderildi - Basarisiz - Okundu */
  Durum: string;

  @Column({ nullable: true, type: 'bit', default:0 })
  OkunduMu: boolean;

  @Column({ nullable: true, type: 'datetime' })
  OkunmaTarihi: Date;

  @Column({ nullable: true, type: 'bit' })
  EpostaGonderildiMi: boolean;

  @Column({ nullable: true, type: 'datetime' })
  EpostaGonderimTarihi: Date;

  @Column({ nullable: true, type: 'int', default: 0 })
  TekrarDenemeSayisi: number;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Link: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  MobilLink: string;

  @CreateDateColumn({ nullable: true, type: 'datetime' })
  OlusturmaTarihi: Date;

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.id)
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

  @ManyToOne(() => Bildirimler, bildirimler => bildirimler.BildirimID)
  @JoinColumn({ name: 'BildirimID' })
  Bildirim: Bildirimler;
}
