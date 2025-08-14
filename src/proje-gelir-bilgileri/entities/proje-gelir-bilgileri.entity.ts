import { Donem } from 'src/donem/entities/donem.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('ProjeGelirBilgileri')
export class ProjeGelirBilgileri {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable:false })
  ProjeID: number;

  @Column({ type: 'int', nullable:false })
  DonemID: number;

  @Column({ nullable: true, type: 'bit', default:0 })
  FSMHLisansGelirimi: boolean;

  @Column({ nullable: true, type: 'bit', default:0 })
  TTOGelirimi: boolean;

  @Column({ nullable: false, type: 'varchar', length:100 })
  GelirTipi: string;

  @Column({ type: 'decimal', precision: 16, scale: 2, nullable: false })
  Gelir: number;
  
  @ManyToOne(() => Projeler, proje => proje.ProjeID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProjeID' })
  Proje: Projeler;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

}
