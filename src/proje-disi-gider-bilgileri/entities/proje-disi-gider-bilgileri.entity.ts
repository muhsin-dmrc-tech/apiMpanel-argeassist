import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { GiderTipi } from 'src/gider-tipleri/entities/gider-tipleri.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('ProjeDisiGiderBilgileri')
export class ProjeDisiGiderBilgileri {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  GiderTipiID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ nullable: true, type: 'bit', default: 0 })
  TTOGiderimi: boolean;

  @Column({ type: 'decimal', precision: 16, scale: 2, nullable: false })
  Gider: number;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => GiderTipi, giderTipi => giderTipi.GiderTipiID)
  @JoinColumn({ name: 'GiderTipiID' })
  GiderTipi: GiderTipi;

}
