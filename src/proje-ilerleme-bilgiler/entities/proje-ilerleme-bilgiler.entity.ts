import { Donem } from 'src/donem/entities/donem.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('ProjeIlerlemeBilgiler')
export class ProjeIlerlemeBilgiler {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable:false })
  ProjeID: number;

  @Column({ type: 'int', nullable:false })
  DonemID: number;

  @Column({ nullable: false, type: 'text' })
  Bilgi: string;
  
  @ManyToOne(() => Projeler, proje => proje.ProjeID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProjeID' })
  Proje: Projeler;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

}
