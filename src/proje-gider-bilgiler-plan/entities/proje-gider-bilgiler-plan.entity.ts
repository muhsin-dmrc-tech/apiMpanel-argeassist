import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('ProjeGiderBilgilerPlan', { schema: 'rpa' })
export class ProjeGiderBilgilerPlan {
  @PrimaryGeneratedColumn({ type: 'int' })
  ProjeGiderBilgilerPlanID: number;

  @CreateDateColumn({ nullable: true, type: 'datetime' })
  KayitTarihi: Date;

  @UpdateDateColumn({ nullable: true, type: 'datetime' })
  GuncellemeTarihi: Date;  

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  ProjeID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ type: 'bit', nullable: false,default:1})
  Durum: boolean;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Projeler, proje => proje.ProjeID)
  @JoinColumn({ name: 'ProjeID' })
  Proje: Projeler;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;
}
