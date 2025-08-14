import { Donem } from 'src/donem/entities/donem.entity';
import { GiderTipi } from 'src/gider-tipleri/entities/gider-tipleri.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('ProjeGiderBilgileri')
export class ProjeGiderBilgileri {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable:false })
  ProjeID: number;

  @Column({ type: 'int', nullable:false })
  GiderTipiID: number;

  @Column({ type: 'int', nullable:false })
  DonemID: number;

  @Column({ nullable: true, type: 'bit', default:0 })
  TTOGiderimi: boolean;

  @Column({ type: 'decimal', precision: 16, scale: 2, nullable: false })
  Gider: number;
  
  @ManyToOne(() => Projeler, proje => proje.ProjeID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProjeID' })
  Proje: Projeler;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => GiderTipi, giderTipi => giderTipi.GiderTipiID)
  @JoinColumn({ name: 'GiderTipiID' })
  GiderTipi: GiderTipi;

}
