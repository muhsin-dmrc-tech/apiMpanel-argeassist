import { Firma } from 'src/firmalar/entities/firma.entity';
import { GrupYetkileri } from 'src/grup-yetkileri/entities/grup-yetkileri.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('KullaniciGruplari')
export class KullaniciGruplari {
  @PrimaryGeneratedColumn({ type: 'int' })
  GrupID: number;

  @Column({ type: 'int', nullable: false })
  IliskiID: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  GrupAdi: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  Tip: number;//3 teknokent 1 Firma

  @OneToMany(() => GrupYetkileri, grupYetkileri => grupYetkileri.Grup)
  Yetkiler: GrupYetkileri[];

  @OneToMany(() => Personel, personel => personel.Grup)
  Kullanicilar: Personel[];

  // Teknik olarak sadece TS desteği için tanımlanıyor
  @ManyToOne(() => Firma, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'IliskiID' })
  Firma?: Firma;

  @ManyToOne(() => Teknokentler, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'IliskiID' })
  Teknokent?: Teknokentler;

}
