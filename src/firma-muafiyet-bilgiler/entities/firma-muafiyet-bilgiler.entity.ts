import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { MuafiyetTipi } from 'src/muafiyet-tipleri/entities/muafiyet-tipleri.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('FirmaMuafiyetBilgiler')
export class FirmaMuafiyetBilgiler {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ type: 'int', nullable: false })
  MuafiyetTipiID: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, nullable: false })
  Matrah: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, nullable: false })
  MuafiyetTutari: number;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => MuafiyetTipi, muafiyetTipi => muafiyetTipi.MuafiyetTipiID)
  @JoinColumn({ name: 'MuafiyetTipiID' })
  MuafiyetTipi: MuafiyetTipi;

}
