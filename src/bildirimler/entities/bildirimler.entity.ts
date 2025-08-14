import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn
} from 'typeorm';

@Entity('Bildirimler')
export class Bildirimler {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  BildirimID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Baslik: string;

  @Column({ nullable: true, type: 'varchar', length: '100' })
  Anahtar: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Link: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  MobilLink: string;

  @Column({ nullable: false, type: 'text' })
  Icerik: string;

  @Column({ nullable: false, type: 'varchar', length: '50' })/* Bildirim türü Bilgi - Uyarı - Hata */
  Tur: string;

  @CreateDateColumn({ nullable: false, type: 'datetime' })
  OlusturmaTarihi: Date;

  @Column({ nullable: true, type: 'datetime' })
  PlanlananTarih: Date;

  @Column({ nullable: true, type: 'bit' })
  TumKullanicilar: boolean;

  @Column({ nullable: false, type: 'varchar', length: '50' })/* Bildirimin durumu Beklemede - Gönderildi - Okundu */
  Durum: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;
}
