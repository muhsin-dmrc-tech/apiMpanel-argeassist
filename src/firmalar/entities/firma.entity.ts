import { GorevListesi } from 'src/gorev-listesi/entities/gorev.listesi.entity';
import { KullaniciGruplari } from 'src/kullanici-gruplari/entities/kullanici-gruplari.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import { ProjeBasvuru } from 'src/proje-basvuru/entities/proje.basvuru.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { FirmaBilgileri } from './firma-bilgileri.entity';

@Entity('Firma')
export class Firma {
  @PrimaryGeneratedColumn({ type: 'int' })
  FirmaID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  FirmaAdi: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  PortalLinki: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  PortalKullaniciAdi: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  PortalSifre: string;

  @Column({ nullable: false, type: 'time', precision: 7 })
  MesaiBaslangic: string;

  @Column({ nullable: false, type: 'time', precision: 7 })
  MesaiBitis: string;

  @Column({ nullable: false, type: 'varchar', length: '400' })
  CalismaGunleri: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @OneToMany(() => Personel, personel => personel.Firma, { createForeignKeyConstraints: false })
  Kullanicilar?: Personel[];

  @OneToMany(() => KullaniciGruplari, kullaniciGruplari => kullaniciGruplari.IliskiID)
  Gruplar: KullaniciGruplari[];

  @OneToMany(() => Projeler, projeler => projeler.Firma)
  Projeler: Projeler[];

  @OneToMany(() => ProjeBasvuru, projeler => projeler.Firma)
  ProjeBasvurulari: ProjeBasvuru[];

  @OneToMany(() => Personel, personel => personel.Firma, { createForeignKeyConstraints: false })
  Personeller?: Personel[];

  @OneToMany(() => GorevListesi, gorevListesi => gorevListesi.Firma)
  GorevListesi: GorevListesi[];

  @ManyToOne(() => FirmaBilgileri, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'FirmaID'})
  FirmaBilgisi?: FirmaBilgileri;

}