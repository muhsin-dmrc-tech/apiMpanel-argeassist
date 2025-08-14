import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('PDKS')
export class PDKS {
  @PrimaryGeneratedColumn({ type: 'int' })
  PDKSID: number;

  @Column({ nullable: false, type: 'date' })
  Tarih: Date;

  @Column({ nullable: false, type: 'datetime' })
  Giris: Date;

  @Column({ nullable: false, type: 'datetime' })
  Cikis: Date;

  @Column({ nullable: false, type: 'time', precision: 7 })
  CalismaSuresi: string;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  PersonelID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => Personel, personel => personel.PersonelID)
  @JoinColumn({ name: 'PersonelID' })
  Personel: Personel;
}
