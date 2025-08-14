import { AbonelikPlanlari } from 'src/abonelik-planlari/entities/abonelik-planlari.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne
} from 'typeorm';

@Entity('FirmaAbonelikleri')
export class FirmaAbonelikleri {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  AbonelikID: number;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'bigint', nullable: false })
  AbonelikPlanID: number;

  @Column({ nullable: false, type: 'datetime' })
  BaslangicTarihi: Date;

  @Column({ nullable: false, type: 'datetime' })
  BitisTarihi: Date;

  @Column({ nullable: false, type: 'varchar', length: '50' })/* Bildirimin durumu Aktif - Durduruldu - Bitti - Ödeme Bekleniyor */
  Durum: string;

  @Column({ nullable: false, type: 'bit', default: 0 })
  OtomatikYenileme: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;

  @ManyToOne(() => Firma)
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => AbonelikPlanlari, abonelikPlan => abonelikPlan.AbonelikPlanID)
  @JoinColumn({ name: 'AbonelikPlanID' })
  AbonelikPlan: AbonelikPlanlari;
}
