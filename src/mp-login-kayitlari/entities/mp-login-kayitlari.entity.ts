import { MpKullanicilar } from 'src/mp-kullanicilar/entities/mp-kullanicilar.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Check,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('MpLoginKayitlari')
export class MpLoginKayitlari {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  KullaniciId: number;

  @Column({ type: 'datetime',default: "GETDATE()"})
  GirisZamani: Date;

  @Column({ type: 'varchar', length: '45' })
  IPAdresi: string;

  @Column({ type: 'varchar', length: '255' })
  CihazBilgisi: string;

  @Column({ type:'bit',default: 0 })
  BasariliMi: boolean;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  HataNedeni?: string;

  @ManyToOne(() => MpKullanicilar, kullanici => kullanici.loginKayitlari)
  @JoinColumn({ name: 'KullaniciId' })
  Kullanici: MpKullanicilar;
}
