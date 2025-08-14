import { FirmaBilgileri } from 'src/firmalar/entities/firma-bilgileri.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';

@Entity('Teknokentler')
export class Teknokentler {
  @PrimaryGeneratedColumn({ type: 'int' })
  TeknokentID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  TeknokentAdi: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Sehir: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Ilce: string;

  @Column({ nullable: true, type: 'varchar', length: '20' })
  Telefon: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Eposta: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  WebSitesi: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  Adres: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @OneToMany(() => Personel, personel => personel.Teknokent, { createForeignKeyConstraints: false })
  Kullanicilar?: Personel[];

  @OneToMany(() => Projeler, projeler => projeler.Teknokent)
  Projeler: Projeler[];

  @ManyToOne(() => FirmaBilgileri, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'TeknokentID' })
  TeknokentBilgisi?: FirmaBilgileri;
}
