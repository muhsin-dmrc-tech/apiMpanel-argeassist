import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('ProjeDisiGelirBilgileri')
export class ProjeDisiGelirBilgileri {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable:false })
  FirmaID: number;

  @Column({ type: 'int', nullable:false })
  DonemID: number;

  @Column({ nullable: true, type: 'bit', default:0 })
  LisansGelirimi: boolean;

  @Column({ nullable: false, type: 'varchar', length:100 })
  GelirTipi: string;

  @Column({ type: 'decimal', precision: 16, scale: 2, nullable: false })
  Gelir: number;
  
  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

}
